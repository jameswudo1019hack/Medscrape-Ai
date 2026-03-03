"""
RAG Chain — Retrieval-Augmented Generation pipeline.
Embeds PubMed abstracts into ChromaDB, retrieves relevant chunks,
and generates cited answers via Google Gemini.
"""

import os
import re
from typing import List, Dict, Any, Generator

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.retrievers import BM25Retriever
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain_classic.retrievers import EnsembleRetriever
from langchain_classic.retrievers.document_compressors import CrossEncoderReranker
from langchain_classic.retrievers import ContextualCompressionRetriever

from pubmed_tool import format_paper_for_context


# ── Preload models (loaded once at import time) ─────────────
_embeddings = HuggingFaceEmbeddings(model_name="pritamdeka/S-PubMedBert-MS-MARCO")
_cross_encoder = HuggingFaceCrossEncoder(model_name="cross-encoder/ms-marco-MiniLM-L-12-v2")


# ── System prompt ────────────────────────────────────────────
SYSTEM_PROMPT = """You are BioMed RAG Agent, an AI research assistant specialising
in biomedical and clinical literature. You answer questions by synthesising
information from retrieved PubMed abstracts.

RULES:
1. ONLY use information from the provided context (retrieved abstracts).
2. Cite sources using EXACTLY this format: [PMID: <number>]
   - Place a citation after EVERY factual claim. Never make an uncited claim.
   - ALWAYS cite ONE PMID per bracket: [PMID: 12345678]
   - If multiple sources support a claim, use SEPARATE brackets: [PMID: 12345678] [PMID: 87654321]
   - NEVER group PMIDs: DO NOT write [PMID: 123, PMID: 456]
   - NEVER use bare numbers as citations. Always use the full [PMID: <number>] format.
3. If the context doesn't contain enough information to answer, say so explicitly.
4. Use precise biomedical terminology but explain complex concepts clearly.
5. Structure your answer with markdown headings and bullet points for readability.
   Use: a title heading (#), then brief summary paragraph, then detailed findings
   with subheadings (## or **Bold:**), then limitations.
6. Weigh evidence by study type: meta-analyses and systematic reviews carry
   more weight than individual trials, which carry more weight than case
   reports or narrative reviews. Note the study type when it matters.
7. Mention conflicting findings if present in the literature.
8. End with a "Limitations" note if the evidence is sparse or preliminary.
9. Each abstract's "Study Type" field tells you the publication type — use it
   to gauge the strength of evidence.
10. Use **bold** to highlight key statistics, percentages, and important findings.

CONTEXT (Retrieved PubMed Abstracts):
{context}

QUESTION: {question}

Provide a well-structured, cited answer:"""


FOLLOWUP_SYSTEM_PROMPT = """You are BioMed RAG Agent, an AI research assistant specialising
in biomedical and clinical literature. You answer follow-up questions by considering both
the previous conversation context and newly retrieved PubMed abstracts.

RULES:
1. ONLY use information from the provided context (retrieved abstracts) and previous answer.
2. Cite sources using EXACTLY this format: [PMID: <number>]
   - Place a citation after EVERY factual claim. Never make an uncited claim.
   - ALWAYS cite ONE PMID per bracket: [PMID: 12345678]
   - If multiple sources support a claim, use SEPARATE brackets: [PMID: 12345678] [PMID: 87654321]
   - NEVER group PMIDs: DO NOT write [PMID: 123, PMID: 456]
   - NEVER use bare numbers as citations. Always use the full [PMID: <number>] format.
3. If the context doesn't contain enough information to answer, say so explicitly.
4. Use precise biomedical terminology but explain complex concepts clearly.
5. Structure your answer with markdown headings and bullet points for readability.
   Use: a title heading (#), then brief summary paragraph, then detailed findings
   with subheadings (## or **Bold:**), then limitations.
6. Weigh evidence by study type: meta-analyses and systematic reviews carry
   more weight than individual trials, which carry more weight than case
   reports or narrative reviews. Note the study type when it matters.
7. Mention conflicting findings if present in the literature.
8. End with a "Limitations" note if the evidence is sparse or preliminary.
9. Each abstract's "Study Type" field tells you the publication type — use it
   to gauge the strength of evidence.
10. Use **bold** to highlight key statistics, percentages, and important findings.

PREVIOUS ANSWER:
{previous_context}

CONTEXT (Retrieved PubMed Abstracts):
{context}

FOLLOW-UP QUESTION: {question}

Provide a well-structured, cited answer:"""


def build_rag_chain(papers: List[Dict], api_key: str, context: str | None = None) -> tuple:
    """
    Build a RAG chain from a list of paper dicts.

    Args:
        papers: List of paper dicts from PubMed
        api_key: Google API key
        context: Optional previous answer for follow-up questions

    Returns:
        Tuple of (chain, retriever, vectorstore)
    """
    os.environ["GOOGLE_API_KEY"] = api_key
    
    # ── Step 1: Create Documents ─────────────────────────────
    documents = []
    for paper in papers:
        base_meta = {
            "pmid": paper["pmid"],
            "title": paper["title"],
            "authors": paper["authors"],
            "journal": paper["journal"],
            "year": paper["year"],
            "publication_type": paper.get("publication_type", "Journal Article"),
        }

        # If the paper has full-text sections from PMC, create section documents
        ft = paper.get("full_text_sections")
        if ft:
            header = (
                f"Title: {paper['title']}\n"
                f"Authors: {paper['authors']}\n"
                f"Journal: {paper['journal']} ({paper['year']})\n"
                f"Study Type: {paper.get('publication_type', 'Journal Article')}\n"
                f"PMID: {paper['pmid']}\n"
            )
            for section_name in ("introduction", "methods", "results", "discussion"):
                section_text = ft.get(section_name, "")
                if section_text and len(section_text.strip()) > 50:
                    doc = Document(
                        page_content=f"{header}Section: {section_name.title()}\n\n{section_text}",
                        metadata={**base_meta, "section": section_name},
                    )
                    documents.append(doc)

            # Also add the abstract as a document for completeness
            abstract_text = format_paper_for_context(paper)
            documents.append(Document(page_content=abstract_text, metadata={**base_meta, "section": "abstract"}))
        else:
            text = format_paper_for_context(paper)
            documents.append(Document(page_content=text, metadata=base_meta))
    
    # ── Step 2: Section-aware chunking ──────────────────────
    # Structured PubMed abstracts have labeled sections (BACKGROUND,
    # METHODS, RESULTS, CONCLUSIONS) separated by \n\n.  We split on
    # those boundaries so each chunk is a coherent section.  Short
    # abstracts stay whole.  Each chunk gets the paper's metadata
    # header prepended so the LLM always knows which paper it's from.
    _SECTION_RE = re.compile(
        r'\n\n(?=[A-Z][A-Z /&]+:)',  # split before section labels
    )
    _overflow_splitter = RecursiveCharacterTextSplitter(
        chunk_size=3000, chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " "],
    )
    chunks = []
    for doc in documents:
        text = doc.page_content
        if len(text) <= 3000:
            # Short enough to keep whole
            chunks.append(doc)
            continue
        # Split the abstract portion at section boundaries
        # The header (Title/Authors/Journal/PMID) is before "Abstract:"
        header_end = text.find("Abstract:")
        if header_end == -1:
            chunks.append(doc)
            continue
        header = text[:header_end + len("Abstract:")]
        abstract_body = text[header_end + len("Abstract:"):]
        sections = _SECTION_RE.split(abstract_body)
        sections = [s.strip() for s in sections if s.strip()]

        if len(sections) <= 1:
            # Not a structured abstract — fall back to recursive splitter
            chunks.extend(_overflow_splitter.split_documents([doc]))
        else:
            for section in sections:
                chunk_text = f"{header}\n{section}"
                chunks.append(Document(
                    page_content=chunk_text,
                    metadata=doc.metadata.copy(),
                ))

    # ── Step 3: Build hybrid retriever (vector + BM25) ──────
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=_embeddings,
        collection_name="pubmed_abstracts",
    )

    vector_retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": min(20, len(chunks))},
    )

    bm25_retriever = BM25Retriever.from_documents(chunks, k=min(20, len(chunks)))

    ensemble_retriever = EnsembleRetriever(
        retrievers=[vector_retriever, bm25_retriever],
        weights=[0.6, 0.4],
    )

    # ── Step 3b: Cross-encoder reranking ─────────────────────
    # top_n=20 so the reranker passes more chunks through, then we
    # apply diversity filtering to ensure multiple papers are represented.
    reranker = CrossEncoderReranker(model=_cross_encoder, top_n=20)
    retriever = ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=ensemble_retriever,
    )
    
    # ── Step 4: Build chain ──────────────────────────────────
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-pro",
        google_api_key=api_key,
        temperature=0.2,
        max_output_tokens=8192,
    )

    def _diversify_docs(docs, max_per_paper: int = 2, target: int = 12):
        """Ensure multiple papers are represented in the context.

        Takes reranked docs (already sorted by relevance) and limits each
        paper to at most `max_per_paper` chunks.  This prevents one or two
        highly-scored papers from monopolising the entire context window.
        """
        seen: Dict[str, int] = {}
        result = []
        for doc in docs:
            pmid = doc.metadata.get("pmid", "")
            count = seen.get(pmid, 0)
            if count < max_per_paper:
                result.append(doc)
                seen[pmid] = count + 1
                if len(result) >= target:
                    break
        return result

    def format_docs(docs):
        diverse = _diversify_docs(docs)
        return "\n\n---\n\n".join(doc.page_content for doc in diverse)

    if context:
        prompt = ChatPromptTemplate.from_template(FOLLOWUP_SYSTEM_PROMPT)
        # Truncate context to avoid exceeding token limits
        truncated_context = context[:4000]
        chain = (
            {
                "context": retriever | format_docs,
                "question": RunnablePassthrough(),
                "previous_context": lambda _: truncated_context,
            }
            | prompt
            | llm
            | StrOutputParser()
        )
    else:
        prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)
        chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
    
    return chain, retriever, vectorstore


def _verify_citations(answer: str, papers: List[Dict]) -> str:
    """Validate PMID citations in the answer against actual source papers.

    - Removes citations whose PMID doesn't match any paper in the source list.
    - Strips leftover bare-number citations like [1] or [2,3].
    """
    valid_pmids = {p["pmid"] for p in papers}

    # Fix citations with valid PMIDs — keep them
    # Remove citations with invalid/hallucinated PMIDs
    def _replace_citation(m):
        pmid = m.group(1)
        if pmid in valid_pmids:
            return m.group(0)  # keep valid citation
        return ""              # remove hallucinated citation

    result = re.sub(r'\[PMID:\s*(\d+)\]', _replace_citation, answer)

    # Strip any leftover bare-number citations like [1], [2,3], [1-3]
    result = re.sub(r'\[(\d+(?:\s*[,\-]\s*\d+)*)\]', '', result)

    # Clean up double spaces left behind
    result = re.sub(r'  +', ' ', result)

    return result


def query_with_sources(rag_result: tuple, question: str, papers: List[Dict]) -> Dict:
    """
    Query the RAG chain and extract cited sources.

    Args:
        rag_result: Tuple of (chain, retriever, vectorstore) from build_rag_chain()
        question: User's question
        papers: Original paper list (for source metadata)

    Returns:
        Dict with 'answer' and 'sources' keys
    """
    chain, retriever, vectorstore = rag_result

    # Get answer and verify citations
    answer = _verify_citations(chain.invoke(question), papers)

    # Return ALL papers — cited ones first, then the rest
    cited_pmids = set(re.findall(r'PMID:\s*(\d+)', answer))
    cited = [p for p in papers if p["pmid"] in cited_pmids]
    uncited = [p for p in papers if p["pmid"] not in cited_pmids]
    sources = cited + uncited

    # Clean up vectorstore
    try:
        vectorstore.delete_collection()
    except Exception:
        pass

    return {
        "answer": answer,
        "sources": sources,
    }


def stream_with_sources(
    rag_result: tuple,
    question: str,
    papers: List[Dict],
) -> Generator[Dict, None, None]:
    """Stream answer tokens, then yield sources as final event.

    Sources are determined by extracting PMID citations from the generated
    answer text.  We no longer call retriever.invoke() a second time — the
    retriever already ran inside the chain during streaming.
    """
    chain, retriever, vectorstore = rag_result

    full_answer = ""
    for chunk in chain.stream(question):
        full_answer += chunk
        yield {"type": "token", "data": chunk}

    # Verify citations and emit corrected answer as a replacement event
    verified = _verify_citations(full_answer, papers)
    if verified != full_answer:
        yield {"type": "answer_replace", "data": verified}
        full_answer = verified

    # Return ALL papers that were fed into the RAG chain as sources.
    # Cited papers (mentioned in the answer) come first, then the rest.
    cited_pmids = set(re.findall(r'PMID:\s*(\d+)', full_answer))
    cited = [p for p in papers if p["pmid"] in cited_pmids]
    uncited = [p for p in papers if p["pmid"] not in cited_pmids]
    sources = cited + uncited

    try:
        vectorstore.delete_collection()
    except Exception:
        pass

    yield {"type": "sources", "data": sources}
    yield {"type": "done"}
