"""
RAG Chain — Retrieval-Augmented Generation pipeline.
Embeds PubMed abstracts into ChromaDB, retrieves relevant chunks,
and generates cited answers via Google Gemini.
"""

import os
from typing import List, Dict, Any

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
_embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
_cross_encoder = HuggingFaceCrossEncoder(model_name="cross-encoder/ms-marco-MiniLM-L-6-v2")


# ── System prompt ────────────────────────────────────────────
SYSTEM_PROMPT = """You are BioMed RAG Agent, an AI research assistant specialising 
in biomedical and clinical literature. You answer questions by synthesising 
information from retrieved PubMed abstracts.

RULES:
1. ONLY use information from the provided context (retrieved abstracts).
2. Cite sources using [PMID: <number>] after each claim.
3. If the context doesn't contain enough information to answer, say so explicitly.
4. Use precise biomedical terminology but explain complex concepts clearly.
5. Structure your answer with a brief summary first, then detailed findings.
6. Mention conflicting findings if present in the literature.
7. End with a "Limitations" note if the evidence is sparse or preliminary.

CONTEXT (Retrieved PubMed Abstracts):
{context}

QUESTION: {question}

Provide a well-structured, cited answer:"""


def build_rag_chain(papers: List[Dict], api_key: str) -> tuple:
    """
    Build a RAG chain from a list of paper dicts.

    Returns:
        Tuple of (chain, retriever, vectorstore)
    """
    os.environ["GOOGLE_API_KEY"] = api_key
    
    # ── Step 1: Create Documents ─────────────────────────────
    documents = []
    for paper in papers:
        text = format_paper_for_context(paper)
        doc = Document(
            page_content=text,
            metadata={
                "pmid": paper["pmid"],
                "title": paper["title"],
                "authors": paper["authors"],
                "journal": paper["journal"],
                "year": paper["year"],
            }
        )
        documents.append(doc)
    
    # ── Step 2: Split into chunks ────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " "],
    )
    chunks = splitter.split_documents(documents)
    
    # ── Step 3: Build hybrid retriever (vector + BM25) ──────
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=_embeddings,
        collection_name="pubmed_abstracts",
    )

    vector_retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": min(15, len(chunks))},
    )

    bm25_retriever = BM25Retriever.from_documents(chunks, k=min(15, len(chunks)))

    ensemble_retriever = EnsembleRetriever(
        retrievers=[vector_retriever, bm25_retriever],
        weights=[0.6, 0.4],
    )

    # ── Step 3b: Cross-encoder reranking ─────────────────────
    reranker = CrossEncoderReranker(model=_cross_encoder, top_n=5)
    retriever = ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=ensemble_retriever,
    )
    
    # ── Step 4: Build chain ──────────────────────────────────
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.2,
        max_output_tokens=2048,
    )
    
    prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)
    
    def format_docs(docs):
        return "\n\n---\n\n".join(doc.page_content for doc in docs)
    
    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    return chain, retriever, vectorstore


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

    # Get answer
    answer = chain.invoke(question)

    # Get retrieved docs for source attribution
    retrieved_docs = retriever.invoke(question)

    # Extract unique PMIDs from retrieved chunks
    cited_pmids = set()
    for doc in retrieved_docs:
        pmid = doc.metadata.get("pmid", "")
        if pmid:
            cited_pmids.add(pmid)

    # Also extract PMIDs mentioned in the answer text
    import re
    answer_pmids = re.findall(r'PMID:\s*(\d+)', answer)
    cited_pmids.update(answer_pmids)

    # Match back to full paper metadata
    paper_lookup = {p["pmid"]: p for p in papers}
    sources = []
    for pmid in cited_pmids:
        if pmid in paper_lookup:
            sources.append(paper_lookup[pmid])

    # Clean up vectorstore
    try:
        vectorstore.delete_collection()
    except Exception:
        pass

    return {
        "answer": answer,
        "sources": sources,
    }
