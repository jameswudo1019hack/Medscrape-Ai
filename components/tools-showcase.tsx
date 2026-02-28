"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Search, Brain, FileText, Sliders, Shield } from "lucide-react"

const tools = [
  {
    id: "pubmed-search",
    icon: Search,
    title: "Real-time PubMed Search",
    description:
      "Queries NCBI's Entrez E-utilities API in real-time. Supports relevance-based and recency-based sorting, with configurable result limits up to 20 papers per query.",
    features: [
      "Relevance and date-based sorting",
      "Configurable result limits (3-20 papers)",
      "Full PubMed query syntax support",
    ],
  },
  {
    id: "rag-pipeline",
    icon: Brain,
    title: "RAG Pipeline",
    description:
      "Retrieved abstracts are chunked, embedded with Google's embedding model, and stored in ChromaDB. Semantic similarity retrieval ensures the most relevant context reaches the LLM.",
    features: [
      "Recursive text splitting with overlap",
      "Google Gemini embeddings",
      "ChromaDB vector store with similarity search",
    ],
  },
  {
    id: "citation-tracking",
    icon: FileText,
    title: "Citation Tracking",
    description:
      "Every answer includes PMID-based citations traced back to the source papers. View full metadata including authors, journal, year, and a direct link to PubMed.",
    features: [
      "Automatic PMID extraction from answers",
      "Source metadata display",
      "Direct PubMed links for each citation",
    ],
  },
  {
    id: "search-config",
    icon: Sliders,
    title: "Configurable Parameters",
    description:
      "Bring your own Google Gemini API key, control how many papers to retrieve, and choose between relevance-first or recency-first search strategies.",
    features: [
      "BYO API key (free from Google AI Studio)",
      "Adjustable paper count slider",
      "Multiple search strategy options",
    ],
  },
  {
    id: "privacy",
    icon: Shield,
    title: "Privacy-First Design",
    description:
      "Your API key is never stored on our servers. All processing happens per-session, and vector stores are cleaned up after each query to ensure your data stays private.",
    features: [
      "No server-side API key storage",
      "Per-session vector store cleanup",
      "No query logging or tracking",
    ],
  },
]

export function ToolsShowcase() {
  return (
    <section className="border-y border-border/40 bg-frost py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Explore our capabilities
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Everything under the hood that powers your research queries
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {tools.map((tool) => (
              <AccordionItem key={tool.id} value={tool.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
                      <tool.icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">{tool.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-13 ml-13">
                    <p className="text-muted-foreground">{tool.description}</p>
                    <ul className="mt-4 space-y-2">
                      {tool.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-teal" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
