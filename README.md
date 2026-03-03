# MedScrape

**AI-powered biomedical research assistant that searches PubMed in real-time and generates cited, evidence-graded answers using Retrieval-Augmented Generation.**

I built this because I was spending hours manually searching PubMed for literature reviews — reading dozens of abstracts to piece together an answer to a specific research question. MedScrape automates that workflow: ask a question in plain English, get a synthesised, cited answer grounded in the latest published research, with full-text access for high-quality papers.

---

## How It Works

```
User Query (plain English)
       │
       ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Query Processing │────▶│  PubMed Search    │────▶│  RAG Pipeline    │
│  • Decomposition  │     │  • MeSH mapping   │     │  • PubMedBERT    │
│  • MeSH lookup    │     │  • Multi-query     │     │  • BM25 + vector │
│  • Gemini expand  │     │  • Date filtering  │     │  • Cross-encoder │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                  │                        │
                                  ▼                        ▼
                         ┌──────────────────┐    ┌──────────────────┐
                         │  PMC Full Text    │    │  Evidence Grading│
                         │  Retrieve sections│    │  A/B/C/D grades  │
                         │  for top papers   │    │  per paper       │
                         └──────────────────┘    └──────────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────────┐
                                                  │  Gemini 2.5 Pro  │
                                                  │  Cited answer    │
                                                  │  with [PMID] refs│
                                                  └──────────────────┘
```

### Standard Mode
1. **Query Decomposition** — Complex multi-entity questions split into focused sub-queries via Gemini
2. **MeSH Term Mapping** — Queries resolved to MeSH descriptors and synonyms via NCBI for better recall
3. **Query Expansion** — Gemini generates alternative search terms with medical synonyms
4. **Parallel PubMed Search** — All query variants searched concurrently via NCBI E-utilities
5. **Abstract Retrieval** — Full abstracts, metadata, publication types, and DOIs fetched
6. **Evidence Grading** — Each paper assigned A/B/C/D grade using Oxford CEBM-inspired scoring
7. **PMC Full-Text Enrichment** — Top-ranked papers augmented with full article text from PubMed Central
8. **Hybrid Retrieval** — PubMedBERT + BM25 + cross-encoder reranking across abstracts and full-text sections
9. **Citation Verification** — LLM citations validated against actual source PMIDs; hallucinated citations removed
10. **RAG Generation** — Gemini 2.5 Pro synthesises a cited, markdown-formatted answer

### Deep Research Mode (Agentic)
Uses a **LangGraph StateGraph** for iterative multi-step reasoning:
- `plan` → `search` → `evaluate` → `refine` (if gaps) → `search` → `synthesize`
- Gemini evaluates coverage gaps after each search iteration
- Automatically generates targeted follow-up queries for uncovered aspects
- Up to 2 refinement cycles before final synthesis
- Live reasoning timeline shown in the UI

---

## Features

### Search & Retrieval
- **Streaming answers** — Token-by-token response with real-time progress
- **Deep Research mode** — LangGraph agent with iterative search-evaluate-refine cycles
- **MeSH term mapping** — Controlled vocabulary expansion via NCBI
- **Query decomposition** — Multi-entity questions split into focused sub-queries
- **Parallel search** — All query variants searched concurrently (5 threads)
- **PMC full-text** — Fetches full articles from PubMed Central for top papers

### Evidence Quality
- **Evidence grading** — A/B/C/D grades per paper (study design 40%, recency 20%, journal 15%, sample size 15%, reporting quality 10%)
- **Evidence distribution** — Grade breakdown shown in transparency panel
- **Publication type badges** — Meta-Analysis, Systematic Review, RCT, etc. with color coding
- **Study type filtering** — Filter by reviews, clinical trials, or all study types
- **Relevance + quality ranking** — 60% PubMed relevance + 40% evidence quality score

### Citations & References
- **Citation verification** — Hallucinated PMIDs stripped from answers
- **Multiple reference styles** — Vancouver, APA 7th, Harvard, AMA, Chicago
- **Citation badges** — Superscript numbered citations linked to source cards
- **Export options** — PDF reports, BibTeX, RIS (Zotero/Mendeley compatible), plain text

### UI & UX
- **Search transparency** — Sub-queries, MeSH mappings, paper counts, evidence grades at each pipeline stage
- **Agent reasoning timeline** — Visual step-by-step trace for Deep Research mode
- **Follow-up questions** — Contextual follow-ups with previous answer as context
- **Search history** — Persistent local history with one-click replay
- **Date range filtering** — All time, last year, or last 5 years
- **Dark/light mode** — System-aware theme toggle
- **Full text indicator** — Papers with PMC full text marked with badge

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **Backend** | FastAPI (Python) |
| **LLM** | Google Gemini 2.5 Pro |
| **Embeddings** | PubMedBERT (`pritamdeka/S-PubMedBert-MS-MARCO`) |
| **Cross-Encoder** | `ms-marco-MiniLM-L-12-v2` |
| **Vector Store** | ChromaDB (in-memory, query-specific) |
| **Retrieval** | BM25 + semantic similarity + cross-encoder reranking |
| **Agentic Reasoning** | LangGraph StateGraph |
| **Orchestration** | LangChain |
| **Data Source** | PubMed + PMC / NCBI E-utilities API |
| **PDF Export** | FPDF |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone and install

```bash
git clone https://github.com/jameswu5/medscrape.git
cd medscrape

# Frontend dependencies
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Run both servers

```bash
npm run dev
```

This starts the Next.js frontend on `localhost:3000` and the FastAPI backend on `localhost:8000` concurrently.

Or run them separately:

```bash
npm run dev:frontend   # Next.js on :3000
npm run dev:backend    # FastAPI on :8000
```

### 3. Search

Open `http://localhost:3000`, enter your Gemini API key in settings, and start asking questions.

---

## Example Queries

- *"What are the current approaches to drug-resistant epilepsy treatment?"*
- *"How does GHK-Cu affect wound healing and collagen synthesis?"*
- *"Compare CRISPR-Cas9 and base editing for sickle cell disease therapy"*
- *"What biomarkers predict Alzheimer's disease progression?"*
- *"What is the role of transformer models in ECG arrhythmia detection?"*
- *"Compare metformin vs GLP-1 agonists for type 2 diabetes management"*

---

## Project Structure

```
medscrape/
├── app/
│   ├── page.tsx                        # Main search interface
│   ├── layout.tsx                      # Root layout with theme provider
│   ├── globals.css                     # Global styles + citation badges
│   ├── faq/page.tsx                    # FAQ page
│   ├── how-it-works/page.tsx           # How it works page
│   ├── api/
│   │   ├── search/
│   │   │   ├── route.ts                # Search API proxy
│   │   │   ├── stream/route.ts         # SSE streaming search proxy
│   │   │   └── agent-stream/route.ts   # Deep Research agent proxy
│   │   └── export/pdf/route.ts         # PDF export proxy
│   └── search/components/
│       ├── follow-up-input.tsx         # Follow-up question input
│       ├── loading-progress.tsx        # Search progress indicator
│       └── search-settings.tsx         # Settings panel
├── components/
│   ├── ai-answer-card.tsx              # AI answer with citation badges + reference styles
│   ├── source-card.tsx                 # Paper card with evidence grade + full-text badge
│   ├── source-grid.tsx                 # Paper cards grid layout
│   ├── search-bar.tsx                  # Search input component
│   ├── search-history.tsx              # History sidebar
│   ├── search-transparency.tsx         # Pipeline transparency + evidence grades
│   ├── agent-reasoning.tsx             # Deep Research agent timeline UI
│   ├── landing-hero.tsx                # Landing page hero
│   ├── navbar.tsx                      # Navigation bar
│   ├── footer.tsx                      # Footer
│   └── ui/                             # Radix UI primitives
├── lib/
│   ├── types.ts                        # TypeScript interfaces
│   ├── citation-export.ts              # BibTeX, RIS, Vancouver, APA, Harvard export
│   ├── search-history.ts              # localStorage history
│   └── utils.ts                        # Utility functions
├── backend/
│   ├── main.py                         # FastAPI server + pipeline orchestration
│   ├── rag_chain.py                    # LangChain RAG with hybrid retrieval + full-text
│   ├── pubmed_tool.py                  # PubMed API + MeSH lookup
│   ├── evidence_grading.py             # Oxford CEBM-inspired A/B/C/D evidence grading
│   ├── pmc_tool.py                     # PMC full-text retrieval + section parsing
│   ├── agent_graph.py                  # LangGraph agentic reasoning graph
│   └── requirements.txt                # Python dependencies
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Architecture Decisions

**Why RAG over fine-tuning?**
Biomedical knowledge changes rapidly. RAG retrieves the latest papers at query time rather than relying on a static model — no retraining needed when new research is published.

**Why PubMed?**
PubMed indexes 36M+ citations from biomedical literature. Its E-utilities API is free, doesn't require authentication for low-volume use, and returns structured XML with full metadata.

**Why PubMedBERT over general embeddings?**
Domain-specific embeddings trained on biomedical text significantly outperform general-purpose models (like `all-MiniLM`) for medical literature retrieval — they understand that "MI" means "myocardial infarction", not "Michigan".

**Why hybrid retrieval?**
BM25 (keyword matching) catches exact terms that semantic search might miss, while vector similarity captures meaning. The cross-encoder reranker then scores the combined results for final relevance ranking.

**Why MeSH term mapping?**
PubMed's automatic term mapping is imperfect. Explicitly resolving casual language ("heart attack") to MeSH descriptors ("Myocardial Infarction") and their synonyms improves recall by searching with the controlled vocabulary PubMed is indexed against.

**Why evidence grading?**
Not all papers are equal. A case report and a Cochrane meta-analysis on the same topic warrant very different trust levels. Automated grading surfaces this at a glance and helps the LLM weight evidence correctly in its answer.

**Why PMC full-text?**
Abstracts often omit critical methodological details and quantitative results. Fetching full-text Methods/Results sections from PubMed Central gives the RAG pipeline far richer context — especially important for clinical questions where effect sizes and confidence intervals matter.

**Why LangGraph for Deep Research?**
A single-pass search often misses aspects of complex questions. The StateGraph's evaluate→refine loop lets the agent identify coverage gaps and issue targeted follow-up searches, mimicking how a human researcher would iteratively narrow their search strategy.

**Why ChromaDB in-memory?**
Each query searches for different papers, so a persistent store would accumulate irrelevant data. In-memory embedding ensures the vector store is always fresh and query-specific.

**Why Gemini?**
The free tier provides sufficient quality for abstract synthesis at zero cost, making this tool accessible to any student or researcher. Gemini 2.5 Pro's large context window handles the full-text sections without truncation.

---

## Author

**James Wu** — Biomedical Engineering & Data Science, University of Sydney

---

## License

MIT License — see [LICENSE](LICENSE) for details.
