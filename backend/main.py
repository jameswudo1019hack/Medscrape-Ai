"""
FastAPI backend for MedScrape.
Wraps existing PubMed search + RAG chain into a REST API.
"""

import asyncio
import io
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from fpdf import FPDF

from google import genai

from pubmed_tool import search_pubmed, fetch_abstracts, sort_papers_by_quality, PUBLICATION_TYPE_RANK, lookup_mesh_terms, build_mesh_queries
from rag_chain import build_rag_chain, query_with_sources, stream_with_sources
from evidence_grading import grade_all_papers
from pmc_tool import enrich_papers_with_fulltext
try:
    from agent_graph import agent as agent_graph
    _AGENT_AVAILABLE = agent_graph is not None
except Exception as _agent_err:
    print(f"[main] Agent graph unavailable: {_agent_err}")
    agent_graph = None
    _AGENT_AVAILABLE = False


def expand_query(query: str, api_key: str) -> List[str]:
    """Use Gemini to generate 2-3 alternative PubMed search queries with medical synonyms."""
    client = genai.Client(api_key=api_key)
    resp = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=(
            f"You are a biomedical search expert. Given this research question, "
            f"generate exactly 3 alternative PubMed search queries that use "
            f"medical synonyms, MeSH terms, or related terminology to improve recall. "
            f"Return ONLY the queries, one per line, no numbering or explanation.\n\n"
            f"Question: {query}"
        ),
    )
    lines = [line.strip() for line in resp.text.strip().splitlines() if line.strip()]
    return lines[:3]


def _local_decompose(query: str) -> Optional[List[str]]:
    """Regex-based fallback to split comparison/multi-entity queries without LLM."""
    q = query.strip()

    # Strip leading filler words: "compare", "what is the role of", "difference between", etc.
    q_clean = re.sub(
        r'^(compare|comparing|what\s+is\s+the\s+role\s+of|role\s+of|difference\s+between|differences\s+between)\s+',
        '', q, flags=re.IGNORECASE,
    ).strip()

    # Pattern: "A vs B (context)" or "A versus B (context)"
    m = re.match(r'(.+?)\s+(?:vs\.?|versus)\s+(.+)', q_clean, re.IGNORECASE)
    if m:
        a, b = m.group(1).strip(), m.group(2).strip()
        # Check if there's a shared context after B, e.g. "B for sickle cell"
        ctx_match = re.match(r'(.+?)\s+(?:for|in|on|during|treating|treatment\s+of)\s+(.+)', b, re.IGNORECASE)
        if ctx_match:
            b_entity, context = ctx_match.group(1).strip(), ctx_match.group(2).strip()
            return [f"{a} {context}", f"{b_entity} {context}"]
        return [a, b]

    # Pattern: "A and B in/for C"
    m = re.match(r'(.+?)\s+and\s+(.+?)\s+(?:in|for|on|during|treating|treatment\s+of)\s+(.+)', q_clean, re.IGNORECASE)
    if m:
        a, b, context = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
        return [f"{a} {context}", f"{b} {context}"]

    return None


def decompose_query(query: str, api_key: str) -> List[str]:
    """Split complex queries (comparisons, multi-entity) into focused sub-queries.

    Returns a list of 2-4 sub-queries for complex questions, or [query] for simple ones.
    Uses Gemini when available, with a regex-based fallback.
    """
    # Try LLM-based decomposition first
    client = genai.Client(api_key=api_key)
    try:
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=(
                "You are a biomedical search strategist. Given a research question, "
                "generate 2-4 focused PubMed sub-queries that together cover all aspects "
                "of the question. Each sub-query should be a simple keyword search "
                "(no boolean operators) targeting one specific entity or aspect.\n\n"
                "If the question is already simple and focused on a single topic, "
                "reply with exactly: SIMPLE\n\n"
                "Otherwise reply with 2-4 sub-queries, one per line, no numbering or explanation.\n\n"
                "Examples:\n"
                "Q: compare CRISPR vs base editing for sickle cell\n"
                "CRISPR gene editing sickle cell disease\n"
                "base editing sickle cell disease\n\n"
                "Q: role of IL-6 and TNF-alpha in rheumatoid arthritis\n"
                "IL-6 rheumatoid arthritis\n"
                "TNF-alpha rheumatoid arthritis\n\n"
                "Q: metformin mechanism of action\n"
                "SIMPLE\n\n"
                f"Q: {query}"
            ),
        )
        lines = [line.strip() for line in resp.text.strip().splitlines() if line.strip()]
        if not lines or lines[0].upper() == "SIMPLE":
            return [query]
        return lines[:4]
    except Exception:
        pass

    # Fallback: regex-based decomposition
    local = _local_decompose(query)
    if local:
        return local

    return [query]


def _rank_papers(papers: list, pmid_order: list) -> list:
    """Rank papers by a combined relevance + evidence-quality score.

    PubMed already returns results in relevance order.  We assign a relevance
    score that decays by position (1.0 for first, 0.0 for last) and mix it
    with the evidence grade score (0–100) normalised to 0–1.  The final score
    is 60 % relevance + 40 % quality.  grade_all_papers must be called before
    this function so that every paper already has an evidence_grade.score.
    """
    pmid_rank = {pmid: i for i, pmid in enumerate(pmid_order)}
    n = max(len(pmid_order) - 1, 1)

    def score(p):
        pos = pmid_rank.get(p["pmid"], n)
        relevance = 1.0 - (pos / n)          # 1.0 → 0.0
        quality = p.get("evidence_grade", {}).get("score", 50) / 100  # 0.0 → 1.0
        return 0.6 * relevance + 0.4 * quality

    return sorted(papers, key=score, reverse=True)


app = FastAPI(title="MedScrape API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str
    api_key: str
    max_papers: int = 15
    sort: str = "relevance"
    date_range: str = "all"
    study_type_filter: str = "all"
    context: Optional[str] = None  # Previous answer for follow-up questions


class EvidenceGrade(BaseModel):
    grade: str = ""
    score: int = 0

class Source(BaseModel):
    pmid: str
    title: str
    abstract: str
    abstract_snippet: str
    authors: str
    journal: str
    year: str
    publication_type: str = "Journal Article"
    doi: str = ""
    evidence_grade: Optional[EvidenceGrade] = None
    has_full_text: bool = False


class SearchResponse(BaseModel):
    answer: str
    sources: list[Source]
    papers_found: int
    papers_retrieved: int


def _per_call_budget(query: str, max_papers: int) -> int:
    """Adaptive search depth: broad queries search wider, specific ones narrower.

    Short queries (1-3 words) are broad — we need a large candidate pool
    because many results will overlap across synonym variants and some
    will lack abstracts.  Longer queries are self-filtering.

    We also ensure enough headroom to fill max_papers after dedup + filtering.
    """
    words = len(query.strip().split())
    if words <= 3:
        return max(max_papers * 3, 25)  # broad: cast a very wide net
    if words <= 6:
        return max(max_papers * 2, 15)  # moderate
    return max(max_papers, 10)           # specific: PubMed does the work


def _run_retrieval_pipeline(request: SearchRequest):
    """Run the shared retrieval pipeline. Returns (papers, pmids) or raises HTTPException."""
    sub_queries = decompose_query(request.query, request.api_key)

    per_call = _per_call_budget(request.query, request.max_papers)

    # Build all search variants first, then search in parallel
    all_variants = []
    for sq in sub_queries:
        variants = [sq]
        mesh_data = lookup_mesh_terms(sq)
        mesh_variants = build_mesh_queries(sq, mesh_data)
        variants.extend(mesh_variants)
        try:
            variants.extend(expand_query(sq, request.api_key))
        except Exception:
            pass
        all_variants.extend(variants)

    seen = set()
    pmids = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {
            pool.submit(search_pubmed, v, per_call, request.sort, request.date_range): v
            for v in all_variants
        }
        for future in as_completed(futures):
            try:
                results = future.result()
                for pmid in results:
                    if pmid not in seen:
                        seen.add(pmid)
                        pmids.append(pmid)
            except Exception:
                pass

    if not pmids:
        raise HTTPException(
            status_code=404,
            detail="No papers found for this query. Try a different search term.",
        )

    papers = fetch_abstracts(pmids)
    if not papers:
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch abstracts from PubMed. Please try again.",
        )

    # Drop papers that have no real abstract — they add noise without content
    papers = [p for p in papers if p.get("abstract", "").strip()
              and p["abstract"] != "No abstract available."]

    if not papers:
        raise HTTPException(
            status_code=404,
            detail="Found papers but none had abstracts. Try a broader search term.",
        )

    # Study-type filtering
    if request.study_type_filter == "reviews":
        review_types = {"Meta-Analysis", "Systematic Review", "Review"}
        filtered = [p for p in papers if p.get("publication_type") in review_types]
        if filtered:
            papers = filtered
    elif request.study_type_filter == "trials":
        trial_types = {"Randomized Controlled Trial", "Clinical Trial", "Controlled Clinical Trial"}
        filtered = [p for p in papers if p.get("publication_type") in trial_types]
        if filtered:
            papers = filtered

    # Grade first so the score is available to the ranker
    grade_all_papers(papers)

    # Hybrid score: 60% PubMed relevance + 40% evidence grade score
    papers = _rank_papers(papers, pmids)

    # Trim to the user-requested budget after ranking
    papers = papers[:request.max_papers]

    # PMC full-text enrichment (top 5 papers)
    enrich_papers_with_fulltext(papers, max_fulltext=5)

    return papers, pmids


@app.post("/api/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if not request.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required")

    papers, pmids = _run_retrieval_pipeline(request)
    rag_result = build_rag_chain(papers, request.api_key, context=request.context)
    result = query_with_sources(rag_result, request.query, papers)

    return SearchResponse(
        answer=result["answer"],
        sources=[Source(**s) for s in result["sources"]],
        papers_found=len(pmids),
        papers_retrieved=len(papers),
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@app.post("/api/search/stream")
async def search_stream(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if not request.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required")

    async def event_generator():
        # Step 0: Decompose query
        yield _sse({"type": "progress", "step": "analyzing", "message": "Analyzing query..."})
        sub_queries = await asyncio.to_thread(decompose_query, request.query, request.api_key)
        yield _sse({"type": "transparency", "sub_queries": sub_queries})

        # Step 0b: MeSH term lookup
        yield _sse({"type": "progress", "step": "searching", "message": "Resolving MeSH terms..."})
        all_mesh_data = {}

        def _lookup_mesh():
            for sq in sub_queries:
                mesh = lookup_mesh_terms(sq)
                if mesh:
                    all_mesh_data.update(mesh)

        await asyncio.to_thread(_lookup_mesh)

        if all_mesh_data:
            mesh_mappings = {desc: info.get("entry_terms", [])[:3] for desc, info in all_mesh_data.items()}
            yield _sse({"type": "transparency", "mesh_mappings": mesh_mappings})

        # Step 1: Search PubMed
        yield _sse({"type": "progress", "step": "searching", "message": "Searching PubMed..."})
        per_call = _per_call_budget(request.query, request.max_papers)
        seen = set()
        pmids = []

        def _search_all():
            # Build all variants first
            all_variants = []
            for sq in sub_queries:
                variants = [sq]
                mesh_data = lookup_mesh_terms(sq)
                mesh_variants = build_mesh_queries(sq, mesh_data)
                variants.extend(mesh_variants)
                try:
                    variants.extend(expand_query(sq, request.api_key))
                except Exception:
                    pass
                all_variants.extend(variants)

            # Search in parallel
            with ThreadPoolExecutor(max_workers=5) as pool:
                futures = {
                    pool.submit(search_pubmed, v, per_call, request.sort, request.date_range): v
                    for v in all_variants
                }
                for future in as_completed(futures):
                    try:
                        results = future.result()
                        for pmid in results:
                            if pmid not in seen:
                                seen.add(pmid)
                                pmids.append(pmid)
                    except Exception:
                        pass

        await asyncio.to_thread(_search_all)

        if not pmids:
            yield _sse({"type": "error", "message": "No papers found for this query. Try a different search term."})
            return
        yield _sse({"type": "transparency", "total_papers_found": len(pmids)})

        # Step 2: Fetch abstracts
        yield _sse({"type": "progress", "step": "fetching", "message": "Fetching abstracts..."})
        papers = await asyncio.to_thread(fetch_abstracts, pmids)

        if not papers:
            yield _sse({"type": "error", "message": "Failed to fetch abstracts from PubMed. Please try again."})
            return

        # Drop papers without real abstracts
        papers = [p for p in papers if p.get("abstract", "").strip()
                  and p["abstract"] != "No abstract available."]

        if not papers:
            yield _sse({"type": "error", "message": "Found papers but none had abstracts. Try a broader search term."})
            return
        yield _sse({"type": "transparency", "papers_with_abstracts": len(papers)})

        # Study-type filtering
        if request.study_type_filter == "reviews":
            review_types = {"Meta-Analysis", "Systematic Review", "Review"}
            filtered = [p for p in papers if p.get("publication_type") in review_types]
            if filtered:
                papers = filtered
        elif request.study_type_filter == "trials":
            trial_types = {"Randomized Controlled Trial", "Clinical Trial", "Controlled Clinical Trial"}
            filtered = [p for p in papers if p.get("publication_type") in trial_types]
            if filtered:
                papers = filtered

        # Rank by combined relevance + quality, then trim to budget
        papers = _rank_papers(papers, pmids)
        papers = papers[:request.max_papers]

        # Evidence grading
        grade_all_papers(papers)
        grade_dist = {}
        for p in papers:
            g = p.get("evidence_grade", {}).get("grade", "?")
            grade_dist[g] = grade_dist.get(g, 0) + 1

        yield _sse({"type": "transparency", "papers_after_filtering": len(papers), "evidence_grades": grade_dist})

        # Step 2b: PMC full-text enrichment
        yield _sse({"type": "progress", "step": "fetching", "message": "Fetching full text..."})
        papers = await asyncio.to_thread(enrich_papers_with_fulltext, papers, 5)
        fulltext_count = sum(1 for p in papers if p.get("has_full_text"))
        if fulltext_count > 0:
            yield _sse({"type": "transparency", "fulltext_count": fulltext_count})

        # Step 3: Build RAG chain
        yield _sse({"type": "progress", "step": "analyzing_papers", "message": "Analyzing papers..."})
        rag_result = await asyncio.to_thread(build_rag_chain, papers, request.api_key, request.context)

        # Step 4: Stream answer
        yield _sse({"type": "progress", "step": "generating", "message": "Generating answer..."})
        yield _sse({"type": "metadata", "papers_found": len(pmids), "papers_retrieved": len(papers)})

        for event in stream_with_sources(rag_result, request.query, papers):
            yield _sse(event)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/search/agent-stream")
async def agent_stream(request: SearchRequest):
    """Deep Research mode — runs the LangGraph agentic multi-step pipeline."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if not request.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required")
    if not _AGENT_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent not available. Please restart the backend.")

    async def event_generator():
        initial_state = {
            "query": request.query,
            "api_key": request.api_key,
            "max_papers": request.max_papers,
            "sort": request.sort,
            "date_range": request.date_range,
            "study_type_filter": request.study_type_filter,
            "context": request.context,
            "max_iterations": 2,
            "sub_queries": [],
            "all_papers": [],
            "seen_pmids": set(),
            "coverage_gaps": [],
            "iteration": 0,
            "reasoning_steps": [],
            "events": [],
            "final_answer": "",
        }

        def _run_agent():
            return agent_graph.invoke(initial_state)

        # Run the graph in a thread, then emit all accumulated events
        # The graph accumulates events in state["events"] as it runs
        final_state = await asyncio.to_thread(_run_agent)

        for event in final_state.get("events", []):
            yield _sse(event)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


class ExportRequest(BaseModel):
    query: str
    answer: str
    sources: list[Source]


def _strip_markdown(text: str) -> str:
    """Convert basic markdown to plain text for PDF."""
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*[\*\-]\s+', '  - ', text, flags=re.MULTILINE)
    return text


@app.post("/api/export/pdf")
async def export_pdf(request: ExportRequest):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "MedScrape - Research Report", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Query
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Research Question:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 6, request.query)
    pdf.ln(4)

    # Answer
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Answer:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    plain_answer = _strip_markdown(request.answer)
    pdf.multi_cell(0, 6, plain_answer)
    pdf.ln(6)

    # References
    if request.sources:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "References:", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        for i, src in enumerate(request.sources, 1):
            pdf.set_font("Helvetica", "", 9)
            doi_str = f" DOI: {src.doi}" if src.doi else ""
            ref_line = (
                f"[{i}] {src.authors}. {src.title}. "
                f"{src.journal} ({src.year}). PMID: {src.pmid}{doi_str}"
            )
            pdf.multi_cell(0, 5, ref_line)
            pdf.ln(2)

    buf = io.BytesIO(pdf.output())
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=medscrape-report.pdf"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
