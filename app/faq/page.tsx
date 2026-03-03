"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle, Search, Mail } from "lucide-react"

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is MedScrape?",
        a: "MedScrape is an AI-powered biomedical research tool that lets you search PubMed using natural-language questions. Instead of building complex Boolean queries, you simply ask a clinical or research question and receive a structured, evidence-based answer with inline citations to real PubMed papers.",
      },
      {
        q: "Do I need a PubMed account?",
        a: "No. MedScrape queries PubMed on your behalf using the public NCBI E-utilities API. You do not need a separate PubMed or NCBI account. You just need a free Google Gemini API key to power the AI synthesis.",
      },
      {
        q: "Is MedScrape free to use?",
        a: "Yes, MedScrape is completely free and open-source. The only requirement is a Google Gemini API key, which is also free for standard usage. PubMed access requires no authentication.",
      },
      {
        q: "What types of questions can I ask?",
        a: "You can ask any biomedical or clinical question: drug efficacy comparisons, treatment guidelines, disease mechanisms, diagnostic approaches, epidemiology questions, and more. The AI understands medical terminology and maps your question to the most relevant PubMed literature.",
      },
    ],
  },
  {
    category: "Search & Results",
    questions: [
      {
        q: "How does the AI generate answers?",
        a: "When you submit a query, MedScrape decomposes it into optimized sub-queries, searches PubMed for the most relevant papers, grades them by evidence level (meta-analyses, RCTs, reviews, etc.), and then uses a large language model to synthesize a structured answer with inline citations. Every claim is linked to a specific PubMed ID (PMID).",
      },
      {
        q: "Are the citations real?",
        a: "Yes. Every citation in the AI-generated answer maps to a real PubMed record with a valid PMID. We never fabricate references. You can click any citation to view the original paper on PubMed directly.",
      },
      {
        q: "What do the color-coded badges on source cards mean?",
        a: "The badges indicate the type and evidence level of each paper. Teal badges represent meta-analyses and systematic reviews (highest evidence level). Violet badges are for randomized controlled trials (RCTs) and clinical trials. Sky/blue badges indicate narrative reviews. This helps you quickly assess the strength of the evidence.",
      },
      {
        q: "Can I filter and sort the results?",
        a: "Yes. You can filter results by publication type (meta-analysis, RCT, review, etc.) and sort by relevance, publication date (newest or oldest first), or study type ranking. This lets you focus on the specific evidence types most relevant to your question.",
      },
      {
        q: "What is the Search Transparency panel?",
        a: "The Search Transparency panel shows the complete pipeline behind every search: the sub-queries generated from your question, how many papers were scanned, how many had abstracts, and how many passed filtering. This gives you full visibility into how your results were produced.",
      },
    ],
  },
  {
    category: "Export & Integration",
    questions: [
      {
        q: "Can I export the AI answer and citations?",
        a: "Yes. You can export in three formats: PDF (formatted report with the AI answer and all citations), BibTeX (for LaTeX-based manuscripts), and RIS (compatible with reference managers like Zotero, Mendeley, and EndNote).",
      },
      {
        q: "Can I use MedScrape for systematic reviews?",
        a: "MedScrape is an excellent starting point for systematic reviews. The transparent search pipeline, sub-query decomposition, and evidence grading help you identify relevant literature quickly. However, for formal systematic reviews you should still follow PRISMA guidelines and supplement with manual database searches.",
      },
      {
        q: "Does MedScrape integrate with reference managers?",
        a: "You can export citations in BibTeX and RIS formats, which are compatible with all major reference managers including Zotero, Mendeley, EndNote, and Papers.",
      },
    ],
  },
  {
    category: "Privacy & Data",
    questions: [
      {
        q: "Is my search data private?",
        a: "Yes. Your API key is used only for the current session and is never stored on our servers. Search history is stored locally in your browser. We don't log queries or track usage.",
      },
      {
        q: "Does MedScrape store the papers it retrieves?",
        a: "No. MedScrape retrieves paper metadata (titles, abstracts, authors, PMIDs) from PubMed in real time for each query. We do not store or redistribute full-text content. All links direct you to the original source on PubMed or the publisher.",
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="border-b border-border/50 px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <HelpCircle className="size-3" />
              <span>Support</span>
            </div>
            <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Everything you need to know about using MedScrape for your
              biomedical research.
            </p>
          </div>
        </section>

        {/* FAQ Accordion Sections */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <div className="flex flex-col gap-12">
              {faqCategories.map((category) => (
                <div key={category.category}>
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    {category.category}
                  </h2>
                  <div className="rounded-xl border border-border/60 bg-card">
                    <Accordion type="single" collapsible className="px-1">
                      {category.questions.map((faq, i) => (
                        <AccordionItem
                          key={i}
                          value={`${category.category}-${i}`}
                          className="border-border/40 px-4"
                        >
                          <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="border-t border-border/50 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-md text-center">
            <h2 className="mb-3 text-xl font-bold text-foreground sm:text-2xl">
              Still have questions?
            </h2>
            <p className="mb-6 text-muted-foreground">
              Check out the source code or open an issue on GitHub.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Search className="size-4" />
              Try MedScrape
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
