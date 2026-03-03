"""
LangGraph Agentic Multi-Step Reasoning for MedScrape.

Implements an iterative search-evaluate-refine cycle:
  plan → search → evaluate → (refine → search →)* synthesize

The agent plans a search strategy, executes it, evaluates whether all
aspects of the question are covered, and refines with targeted follow-up
queries if gaps exist.  Finally, it synthesizes a comprehensive answer
from all accumulated papers.
"""

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import TypedDict, Dict, List, Optional

from langgraph.graph import StateGraph, END
from google import genai

from pubmed_tool import (
    search_pubmed,
    fetch_abstracts,
    lookup_mesh_terms,
    build_mesh_queries,
)
from evidence_grading import grade_all_papers
from pmc_tool import enrich_papers_with_fulltext
from rag_chain import build_rag_chain, stream_with_sources


# ── Agent State ──────────────────────────────────────────────

class AgentState(TypedDict, total=False):
    """LangGraph state. Fields updated by returning dicts from nodes."""
    query: str
    api_key: str
    max_papers: int
    sort: str
    date_range: str
    study_type_filter: str
    context: Optional[str]
    sub_queries: List[str]
    all_papers: List[dict]
    seen_pmids: List[str]       # list not set — needs to be serializable
    coverage_gaps: List[str]
    iteration: int
    max_iterations: int
    reasoning_steps: List[dict]
    events: List[dict]
    final_answer: str


# ── Helper functions ─────────────────────────────────────────

def _make_step(step: str, action: str, result: str) -> dict:
    """Create a reasoning step dict."""
    return {"step": step, "action": action, "result": result, "timestamp": time.time()}


def _search_variants(query: str, api_key: str) -> List[str]:
    """Generate all search variants for a query (MeSH + Gemini expansion)."""
    variants = [query]

    # MeSH
    mesh_data = lookup_mesh_terms(query)
    mesh_variants = build_mesh_queries(query, mesh_data)
    variants.extend(mesh_variants)

    # Gemini expansion
    try:
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=(
                "You are a biomedical search expert. Generate exactly 3 alternative "
                "PubMed search queries using medical synonyms or MeSH terms to improve recall. "
                "Return ONLY the queries, one per line, no numbering.\n\n"
                f"Question: {query}"
            ),
        )
        lines = [ln.strip() for ln in resp.text.strip().splitlines() if ln.strip()]
        variants.extend(lines[:3])
    except Exception:
        pass

    return variants


def _parallel_search(
    variants: List[str],
    per_call: int,
    sort: str,
    date_range: str,
    seen: List[str],
) -> List[str]:
    """Search PubMed for all variants in parallel. Returns new PMIDs."""
    seen_set = set(seen)
    new_pmids = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {
            pool.submit(search_pubmed, v, per_call, sort, date_range): v
            for v in variants
        }
        for future in as_completed(futures):
            try:
                for pmid in future.result():
                    if pmid not in seen_set:
                        seen_set.add(pmid)
                        new_pmids.append(pmid)
            except Exception:
                pass
    return new_pmids


# ── Graph Nodes ──────────────────────────────────────────────
# Each node returns a dict of state updates (LangGraph merges them).

def plan_search(state: AgentState) -> dict:
    """Decompose the query into focused sub-queries."""
    query = state["query"]
    api_key = state["api_key"]

    step = _make_step("planning", "Analyzing question", f"Breaking down: {query}")

    try:
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=(
                "You are a biomedical search strategist. Generate 2-4 focused PubMed "
                "sub-queries that cover all aspects of the question. Each sub-query "
                "should be a simple keyword search targeting one specific entity.\n\n"
                "If the question is already simple, reply with exactly: SIMPLE\n\n"
                "Otherwise reply with 2-4 sub-queries, one per line, no numbering.\n\n"
                f"Q: {query}"
            ),
        )
        lines = [ln.strip() for ln in resp.text.strip().splitlines() if ln.strip()]
        sub_queries = [query] if (not lines or lines[0].upper() == "SIMPLE") else lines[:4]
    except Exception:
        sub_queries = [query]

    step2 = _make_step("planning", "Sub-queries identified",
                       f"{len(sub_queries)} sub-queries: {'; '.join(sub_queries)}")

    return {
        "sub_queries": sub_queries,
        "all_papers": [],
        "seen_pmids": [],
        "iteration": 0,
        "coverage_gaps": [],
        "reasoning_steps": [step, step2],
        "events": [
            {"type": "transparency", "sub_queries": sub_queries},
            {"type": "agent_reasoning", **step},
            {"type": "agent_reasoning", **step2},
        ],
        "final_answer": "",
    }


def execute_search(state: AgentState) -> dict:
    """Run PubMed search for current sub-queries."""
    sub_queries = state.get("sub_queries", [])
    api_key = state["api_key"]
    max_papers = state.get("max_papers", 15)
    sort = state.get("sort", "relevance")
    date_range = state.get("date_range", "all")
    seen_pmids = list(state.get("seen_pmids", []))
    all_papers = list(state.get("all_papers", []))
    iteration = state.get("iteration", 0)

    step = _make_step("searching", f"Search iteration {iteration + 1}",
                      f"Searching for {len(sub_queries)} sub-queries")

    events = [
        {"type": "agent_reasoning", **step},
        {"type": "progress", "step": "searching",
         "message": f"Searching PubMed (iteration {iteration + 1})..."},
    ]

    # Per-call budget
    words = len(state["query"].strip().split())
    per_call = max(max_papers * 3, 25) if words <= 3 else (
        max(max_papers * 2, 15) if words <= 6 else max(max_papers, 10)
    )

    all_variants = []
    for sq in sub_queries:
        all_variants.extend(_search_variants(sq, api_key))

    new_pmids = _parallel_search(all_variants, per_call, sort, date_range, seen_pmids)
    updated_seen = seen_pmids + new_pmids

    new_papers_list = []
    if new_pmids:
        events.append({
            "type": "progress", "step": "fetching",
            "message": f"Fetching {len(new_pmids)} new abstracts...",
        })
        fetched = fetch_abstracts(new_pmids)

        # Filter + study-type filter
        fetched = [
            p for p in fetched
            if p.get("abstract", "").strip() and p["abstract"] != "No abstract available."
        ]
        study_filter = state.get("study_type_filter", "all")
        if study_filter == "reviews":
            review_types = {"Meta-Analysis", "Systematic Review", "Review"}
            filtered = [p for p in fetched if p.get("publication_type") in review_types]
            if filtered:
                fetched = filtered
        elif study_filter == "trials":
            trial_types = {"Randomized Controlled Trial", "Clinical Trial", "Controlled Clinical Trial"}
            filtered = [p for p in fetched if p.get("publication_type") in trial_types]
            if filtered:
                fetched = filtered

        new_papers_list = fetched

    updated_papers = all_papers + new_papers_list

    step2 = _make_step("searching", "Papers found",
                       f"Found {len(new_papers_list)} new papers (total: {len(updated_papers)})")
    events.append({"type": "agent_reasoning", **step2})
    events.append({
        "type": "transparency",
        "total_papers_found": len(updated_seen),
        "papers_with_abstracts": len(updated_papers),
    })

    return {
        "all_papers": updated_papers,
        "seen_pmids": updated_seen,
        "reasoning_steps": state.get("reasoning_steps", []) + [step, step2],
        "events": state.get("events", []) + events,
    }


def evaluate_coverage(state: AgentState) -> dict:
    """Evaluate whether retrieved papers cover all aspects of the question."""
    papers = state.get("all_papers", [])
    query = state["query"]
    api_key = state["api_key"]
    iteration = state.get("iteration", 0)
    max_iterations = state.get("max_iterations", 2)

    step = _make_step("evaluating", "Checking coverage",
                      f"Evaluating {len(papers)} papers against the question")

    events = [
        {"type": "agent_reasoning", **step},
        {"type": "progress", "step": "analyzing_papers", "message": "Evaluating evidence coverage..."},
    ]

    # Skip evaluation if max iterations reached
    if iteration >= max_iterations:
        step2 = _make_step("evaluating", "Max iterations reached", "Proceeding to synthesis")
        events.append({"type": "agent_reasoning", **step2})
        return {
            "coverage_gaps": [],
            "reasoning_steps": state.get("reasoning_steps", []) + [step, step2],
            "events": state.get("events", []) + events,
        }

    # If very few papers, always search more
    if len(papers) < 5 and iteration == 0:
        step2 = _make_step("evaluating", "Insufficient coverage",
                           f"Only {len(papers)} papers — will search for more")
        events.append({"type": "agent_reasoning", **step2})
        return {
            "coverage_gaps": [f"Need more papers on: {query}"],
            "reasoning_steps": state.get("reasoning_steps", []) + [step, step2],
            "events": state.get("events", []) + events,
        }

    # Ask Gemini to evaluate coverage
    try:
        paper_titles = "\n".join(
            f"- {p['title']} ({p.get('publication_type', 'Journal Article')}, {p.get('year', '?')})"
            for p in papers[:20]
        )
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=(
                "You are evaluating whether a set of research papers adequately covers "
                "all aspects of a research question.\n\n"
                f"QUESTION: {query}\n\n"
                f"PAPERS RETRIEVED:\n{paper_titles}\n\n"
                "List 1-3 specific coverage gaps as search queries (one per line). "
                "If coverage is adequate, reply with exactly: COMPLETE"
            ),
        )
        lines = [ln.strip() for ln in resp.text.strip().splitlines() if ln.strip()]
        if lines and lines[0].upper() == "COMPLETE":
            gaps = []
            step2 = _make_step("evaluating", "Coverage complete",
                               "All aspects of the question are covered")
        else:
            gaps = [ln for ln in lines if len(ln) > 5][:3]
            step2 = _make_step("evaluating", "Gaps identified",
                               f"Found {len(gaps)} gaps: {'; '.join(gaps)}")
    except Exception:
        gaps = []
        step2 = _make_step("evaluating", "Evaluation skipped", "Proceeding to synthesis")

    events.append({"type": "agent_reasoning", **step2})
    return {
        "coverage_gaps": gaps,
        "reasoning_steps": state.get("reasoning_steps", []) + [step, step2],
        "events": state.get("events", []) + events,
    }


def should_refine(state: AgentState) -> str:
    """Conditional edge: refine if gaps exist, otherwise synthesize."""
    return "refine" if state.get("coverage_gaps") else "synthesize"


def refine_search(state: AgentState) -> dict:
    """Generate new sub-queries targeting coverage gaps."""
    gaps = state.get("coverage_gaps", [])
    iteration = state.get("iteration", 0) + 1

    step = _make_step("refining", "Generating follow-up queries",
                      f"Targeting {len(gaps)} coverage gaps")

    return {
        "sub_queries": gaps,
        "coverage_gaps": [],
        "iteration": iteration,
        "reasoning_steps": state.get("reasoning_steps", []) + [step],
        "events": state.get("events", []) + [
            {"type": "agent_reasoning", **step},
            {"type": "progress", "step": "searching",
             "message": f"Refining search (iteration {iteration + 1})..."},
        ],
    }


def synthesize(state: AgentState) -> dict:
    """Build RAG chain from all papers and generate the final answer."""
    papers = list(state.get("all_papers", []))
    query = state["query"]
    api_key = state["api_key"]
    max_papers = state.get("max_papers", 15)
    context = state.get("context")

    step = _make_step("synthesizing", "Preparing final answer",
                      f"Synthesizing from {len(papers)} papers")

    events = [
        {"type": "agent_reasoning", **step},
        {"type": "progress", "step": "analyzing_papers", "message": "Building knowledge base..."},
    ]

    # Grade first so scores are available to the ranker
    grade_all_papers(papers)

    # Rank: 60% PubMed relevance + 40% evidence grade score
    pmid_order = [p["pmid"] for p in papers]
    pmid_rank = {pmid: i for i, pmid in enumerate(pmid_order)}
    n = max(len(pmid_order) - 1, 1)

    def _score(p):
        pos = pmid_rank.get(p["pmid"], n)
        relevance = 1.0 - (pos / n)
        quality = p.get("evidence_grade", {}).get("score", 50) / 100
        return 0.6 * relevance + 0.4 * quality

    papers = sorted(papers, key=_score, reverse=True)[:max_papers]

    # Enrich top papers with PMC full text
    enrich_papers_with_fulltext(papers, max_fulltext=5)

    # Emit transparency events
    grade_dist: Dict[str, int] = {}
    for p in papers:
        g = p.get("evidence_grade", {}).get("grade", "?")
        grade_dist[g] = grade_dist.get(g, 0) + 1

    events.append({
        "type": "transparency",
        "papers_after_filtering": len(papers),
        "evidence_grades": grade_dist,
    })
    fulltext_count = sum(1 for p in papers if p.get("has_full_text"))
    if fulltext_count > 0:
        events.append({"type": "transparency", "fulltext_count": fulltext_count})

    events.append({"type": "progress", "step": "generating",
                   "message": "Generating comprehensive answer..."})
    events.append({
        "type": "metadata",
        "papers_found": len(state.get("seen_pmids", [])),
        "papers_retrieved": len(papers),
    })

    # Build RAG and stream answer
    rag_result = build_rag_chain(papers, api_key, context=context)
    for event in stream_with_sources(rag_result, query, papers):
        events.append(event)

    return {
        "final_answer": "done",
        "reasoning_steps": state.get("reasoning_steps", []) + [step],
        "events": state.get("events", []) + events,
    }


# ── Build the Graph ──────────────────────────────────────────

def build_agent_graph():
    """Construct and compile the LangGraph agent."""
    graph: StateGraph = StateGraph(AgentState)

    graph.add_node("plan", plan_search)
    graph.add_node("search", execute_search)
    graph.add_node("evaluate", evaluate_coverage)
    graph.add_node("refine", refine_search)
    graph.add_node("synthesize", synthesize)

    graph.set_entry_point("plan")
    graph.add_edge("plan", "search")
    graph.add_edge("search", "evaluate")
    graph.add_conditional_edges(
        "evaluate",
        should_refine,
        {"refine": "refine", "synthesize": "synthesize"},
    )
    graph.add_edge("refine", "search")
    graph.add_edge("synthesize", END)

    return graph.compile()


# Compile once at module level
try:
    agent = build_agent_graph()
except Exception as _e:
    print(f"[agent_graph] Failed to build agent graph: {_e}")
    agent = None
