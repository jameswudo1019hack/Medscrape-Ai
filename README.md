# 🧬 BioMed RAG Agent

**AI-powered biomedical research assistant that searches PubMed in real-time and generates cited answers using Retrieval-Augmented Generation.**

I built this because I was spending hours manually searching PubMed for my thesis literature reviews — reading dozens of abstracts to piece together an answer to a specific research question. This tool automates that workflow: ask a question in plain English, and get a synthesised, cited answer grounded in the latest published research.

![BioMed RAG Agent Demo](docs/demo.png)

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Query  │────▶│ PubMed Search │────▶│  Embed into   │────▶│ Gemini LLM   │
│  (natural    │     │ (E-utilities  │     │  ChromaDB     │     │ generates    │
│   language)  │     │  API)         │     │  vector store │     │ cited answer │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                           │                      │                     │
                           ▼                      ▼                     ▼
                    Retrieve PMIDs         Similarity search      Answer + [PMID]
                    + abstracts            for relevant chunks    citations
```

1. **PubMed Search** — Your question is sent to NCBI's E-utilities API, which returns the most relevant paper IDs
2. **Abstract Retrieval** — Full abstracts, authors, journal info, and publication dates are fetched for each paper
3. **Vector Embedding** — Abstracts are chunked and embedded into an in-memory ChromaDB vector store using Google's embedding model
4. **RAG Generation** — The most relevant chunks are retrieved and fed to Google Gemini, which synthesises a cited answer
5. **Source Attribution** — Every claim is linked back to its source paper with PMID, so you can verify

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Streamlit |
| **LLM** | Google Gemini 2.0 Flash |
| **Embeddings** | Google Generative AI Embeddings |
| **Vector Store** | ChromaDB (in-memory) |
| **Orchestration** | LangChain |
| **Data Source** | PubMed / NCBI E-utilities API |
| **Language** | Python 3.10+ |

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/biomed-rag-agent.git
cd biomed-rag-agent
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Get a Gemini API key

Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Run the app

```bash
streamlit run app.py
```

Enter your API key in the sidebar and start asking questions!

---

## Example Queries

- *"What are the current approaches to drug-resistant epilepsy treatment?"*
- *"How does sleep apnoea affect cardiovascular health in neonates?"*
- *"What is the role of transformer models in ECG arrhythmia detection?"*
- *"Compare CRISPR-Cas9 and base editing for sickle cell disease therapy"*
- *"What biomarkers predict Alzheimer's disease progression?"*

---

## Architecture Decisions

**Why RAG over fine-tuning?**  
Biomedical knowledge changes rapidly. RAG retrieves the latest papers at query time rather than relying on a static model — no retraining needed when new research is published.

**Why PubMed?**  
PubMed indexes 36M+ citations from biomedical literature. Its E-utilities API is free, doesn't require authentication for low-volume use, and returns structured XML with full metadata.

**Why ChromaDB in-memory?**  
Each query searches for different papers, so a persistent store would accumulate irrelevant data. In-memory embedding ensures the vector store is always fresh and query-specific.

**Why Gemini over GPT-4?**  
The free tier of Gemini 2.0 Flash provides sufficient quality for abstract synthesis at zero cost, making this tool accessible to any student or researcher.

---

## Project Structure

```
biomed-rag-agent/
├── app.py              # Streamlit frontend and chat interface
├── pubmed_tool.py      # PubMed E-utilities search and fetch
├── rag_chain.py        # LangChain RAG pipeline with Gemini
├── requirements.txt    # Python dependencies
├── .streamlit/
│   └── config.toml     # Streamlit theme configuration
├── docs/
│   └── demo.png        # Demo screenshot
└── README.md
```

---

## Limitations & Future Work

- **Abstract-only**: Currently retrieves abstracts, not full-text articles (full-text access requires institutional credentials)
- **No persistent memory**: Each conversation starts fresh — could add session-based memory for follow-up questions
- **Single search**: One PubMed query per question — a multi-step agent could reformulate and search iteratively for better coverage
- **Citation precision**: PMID citations in the answer are based on retrieved chunks, not guaranteed to be perfectly matched to specific claims

Future improvements could include multi-step agent reasoning with LangGraph, full-text retrieval via PubMed Central, and a biomedical knowledge graph for entity linking.

---

## Author

**James Wu** — Biomedical Engineering & Data Science, University of Sydney

- [LinkedIn](https://linkedin.com/in/yourprofile)
- [GitHub](https://github.com/yourusername)

---

## License

MIT License — see [LICENSE](LICENSE) for details.
