"""
FastAPI backend for Synapse AI.
Wraps existing PubMed search + RAG chain into a REST API.
"""

import io
import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from fpdf import FPDF

from google import genai

from pubmed_tool import search_pubmed, fetch_abstracts
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


class Source(BaseModel):
    pmid: str
    title: str
    abstract: str
    abstract_snippet: str
    authors: str
    journal: str
    year: str


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

    # Step 1: Expand query with medical synonyms
    queries = [request.query]
    try:
        alt_queries = expand_query(request.query, request.api_key)
        queries.extend(alt_queries)
    except Exception:
        pass  # Fall back to original query only

    # Step 2: Search PubMed with all query variants and deduplicate
    seen = set()
    pmids = []
    per_query = max(request.max_papers // len(queries), 3)
    for q in queries:
        for pmid in search_pubmed(q, max_results=per_query, sort=request.sort, date_range=request.date_range):
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
