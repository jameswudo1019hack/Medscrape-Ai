"""
BioMed RAG Agent — AI-Powered Biomedical Research Assistant
Searches PubMed, retrieves relevant abstracts, and synthesises
referenced answers using Google Gemini + LangChain.

Author: James Wu
"""

import streamlit as st
import os
from pubmed_tool import search_pubmed, fetch_abstracts
from rag_chain import build_rag_chain, query_with_sources

# ── Page Config ──────────────────────────────────────────────
st.set_page_config(
    page_title="BioMed RAG Agent",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom Styling ───────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
    --primary: #0f766e;
    --primary-light: #14b8a6;
    --bg-dark: #0c1220;
    --bg-card: #141c2e;
    --text-primary: #e2e8f0;
    --text-muted: #94a3b8;
    --accent: #2dd4bf;
    --border: #1e293b;
}

.stApp {
    background-color: var(--bg-dark);
    font-family: 'IBM Plex Sans', sans-serif;
}

h1, h2, h3 {
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text-primary) !important;
}

.source-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    transition: border-color 0.2s;
}

.source-card:hover {
    border-color: var(--primary-light);
}

.source-title {
    color: var(--accent);
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 4px;
}

.source-meta {
    color: var(--text-muted);
    font-size: 0.8rem;
    font-family: 'IBM Plex Mono', monospace;
}

.answer-box {
    background: var(--bg-card);
    border-left: 4px solid var(--accent);
    border-radius: 0 12px 12px 0;
    padding: 24px;
    margin: 16px 0;
    line-height: 1.7;
    color: var(--text-primary);
}

.status-badge {
    display: inline-block;
    background: var(--primary);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    font-family: 'IBM Plex Mono', monospace;
}

.hero-subtitle {
    color: var(--text-muted);
    font-size: 1.1rem;
    font-weight: 300;
    margin-top: -8px;
}
</style>
""", unsafe_allow_html=True)


# ── Sidebar ──────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## ⚙️ Configuration")
    
    api_key = st.text_input(
        "Google Gemini API Key",
        type="password",
        help="Get a free key at https://aistudio.google.com/app/apikey"
    )
    
    st.markdown("---")
    
    max_papers = st.slider(
        "Max papers to retrieve",
        min_value=3, max_value=20, value=8,
        help="Number of PubMed abstracts to search and embed"
    )
    
    search_strategy = st.selectbox(
        "Search strategy",
        ["Relevance (default)", "Recent first", "Most cited"],
        help="How to rank PubMed results"
    )
    
    sort_map = {
        "Relevance (default)": "relevance",
        "Recent first": "date",
        "Most cited": "relevance",  # PubMed doesn't support citation sort via API
    }
    
    st.markdown("---")
    st.markdown("### 📊 About")
    st.markdown(
        "BioMed RAG Agent searches **PubMed** in real-time, "
        "embeds retrieved abstracts into a vector store, and uses "
        "**Google Gemini** to synthesise answers grounded in the "
        "literature — with full citations."
    )
    st.markdown(
        "Built by **James Wu** · "
        "[GitHub](https://github.com/yourusername/biomed-rag-agent)"
    )


# ── Main Content ─────────────────────────────────────────────
st.markdown("# 🧬 BioMed RAG Agent")
st.markdown('<p class="hero-subtitle">Ask biomedical research questions — get answers grounded in PubMed literature.</p>', unsafe_allow_html=True)

# Chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

if "paper_cache" not in st.session_state:
    st.session_state.paper_cache = {}

# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"], avatar="🧬" if msg["role"] == "assistant" else "👤"):
        st.markdown(msg["content"], unsafe_allow_html=True)
        if msg.get("sources"):
            with st.expander(f"📄 {len(msg['sources'])} sources cited"):
                for src in msg["sources"]:
                    st.markdown(f"""
                    <div class="source-card">
                        <div class="source-title">{src['title']}</div>
                        <div class="source-meta">
                            {src.get('authors', 'Unknown')} · {src.get('journal', '')} · {src.get('year', '')}
                        </div>
                        <div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">
                            {src.get('abstract_snippet', '')[:300]}...
                        </div>
                        <a href="https://pubmed.ncbi.nlm.nih.gov/{src.get('pmid', '')}" 
                           target="_blank" style="color: var(--accent); font-size: 0.8rem;">
                            View on PubMed →
                        </a>
                    </div>
                    """, unsafe_allow_html=True)

# Chat input
if query := st.chat_input("Ask a biomedical research question..."):
    
    if not api_key:
        st.error("Please enter your Google Gemini API key in the sidebar.")
        st.stop()
    
    # Display user message
    st.session_state.messages.append({"role": "user", "content": query})
    with st.chat_message("user", avatar="👤"):
        st.markdown(query)
    
    # Process query
    with st.chat_message("assistant", avatar="🧬"):
        
        # Step 1: Search PubMed
        with st.status("🔍 Searching PubMed...", expanded=True) as status:
            st.write(f"Querying PubMed for: *{query}*")
            
            pmids = search_pubmed(
                query, 
                max_results=max_papers, 
                sort=sort_map[search_strategy]
            )
            st.write(f"Found **{len(pmids)}** relevant papers")
            
            # Step 2: Fetch abstracts
            st.write("Fetching abstracts...")
            papers = fetch_abstracts(pmids)
            st.write(f"Retrieved **{len(papers)}** abstracts")
            
            # Step 3: Build RAG chain and query
            st.write("Building vector index and generating answer...")
            
            rag_chain = build_rag_chain(papers, api_key)
            result = query_with_sources(rag_chain, query, papers)
            
            status.update(label="✅ Answer generated", state="complete", expanded=False)
        
        # Display answer
        answer = result["answer"]
        sources = result["sources"]
        
        st.markdown(f'<div class="answer-box">{answer}</div>', unsafe_allow_html=True)
        
        if sources:
            with st.expander(f"📄 {len(sources)} sources cited"):
                for src in sources:
                    st.markdown(f"""
                    <div class="source-card">
                        <div class="source-title">{src['title']}</div>
                        <div class="source-meta">
                            {src.get('authors', 'Unknown')} · {src.get('journal', '')} · {src.get('year', '')}
                        </div>
                        <div style="margin-top: 8px; font-size: 0.85rem; color: #94a3b8;">
                            {src.get('abstract_snippet', '')[:300]}...
                        </div>
                        <a href="https://pubmed.ncbi.nlm.nih.gov/{src.get('pmid', '')}" 
                           target="_blank" style="color: #2dd4bf; font-size: 0.8rem;">
                            View on PubMed →
                        </a>
                    </div>
                    """, unsafe_allow_html=True)
        
        # Save to history
        st.session_state.messages.append({
            "role": "assistant",
            "content": f'<div class="answer-box">{answer}</div>',
            "sources": sources,
        })
