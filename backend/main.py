"""
FastAPI backend for Synapse AI.
Wraps existing PubMed search + RAG chain into a REST API.
"""

import io
import re
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from fpdf import FPDF

from google import genai

from pubmed_tool import search_pubmed, fetch_abstracts, sort_papers_by_quality
from rag_chain import build_rag_chain, query_with_sources


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


app = FastAPI(title="Synapse AI API", version="1.0.0")

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
    max_papers: int = 8
    sort: str = "relevance"
    date_range: str = "all"
    study_type_filter: str = "all"


class Source(BaseModel):
    pmid: str
    title: str
    abstract: str
    abstract_snippet: str
    authors: str
    journal: str
    year: str
    publication_type: str = "Journal Article"


class SearchResponse(BaseModel):
    answer: str
    sources: list[Source]
    papers_found: int
    papers_retrieved: int


@app.post("/api/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if not request.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required")

    # Step 0: Decompose complex queries into focused sub-queries
    sub_queries = decompose_query(request.query, request.api_key)

    # Step 1: For each sub-query, expand and search PubMed, then deduplicate
    seen = set()
    pmids = []
    per_sub_query = max(request.max_papers // len(sub_queries), 3)
    for sq in sub_queries:
        variants = [sq]
        try:
            variants.extend(expand_query(sq, request.api_key))
        except Exception:
            pass
        per_variant = max(per_sub_query // len(variants), 2)
        for v in variants:
            time.sleep(0.4)  # NCBI rate limit: 3 req/s without API key
            results = search_pubmed(v, max_results=per_variant, sort=request.sort, date_range=request.date_range)
            for pmid in results:
                if pmid not in seen:
                    seen.add(pmid)
                    pmids.append(pmid)

    if not pmids:
        raise HTTPException(
            status_code=404,
            detail="No papers found for this query. Try a different search term.",
        )

    # Step 3: Fetch abstracts
    papers = fetch_abstracts(pmids)

    if not papers:
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch abstracts from PubMed. Please try again.",
        )

    # Step 3b: Filter by study type (fall back to unfiltered if filter removes all)
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

    # Step 3c: Sort by evidence quality
    papers = sort_papers_by_quality(papers)

    # Step 4: Build RAG chain and query
    rag_result = build_rag_chain(papers, request.api_key)
    result = query_with_sources(rag_result, request.query, papers)

    return SearchResponse(
        answer=result["answer"],
        sources=[Source(**s) for s in result["sources"]],
        papers_found=len(pmids),
        papers_retrieved=len(papers),
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
    pdf.cell(0, 10, "Synapse AI - Research Report", new_x="LMARGIN", new_y="NEXT")
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
            ref_line = (
                f"[{i}] {src.authors}. {src.title}. "
                f"{src.journal} ({src.year}). PMID: {src.pmid}"
            )
            pdf.multi_cell(0, 5, ref_line)
            pdf.ln(2)

    buf = io.BytesIO(pdf.output())
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=synapse-report.pdf"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
