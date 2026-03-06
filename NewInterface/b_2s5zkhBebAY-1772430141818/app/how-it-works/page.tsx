import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Search,
  BrainCircuit,
  SplitSquareVertical,
  Database,
  FileText,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How It Works - Synapse AI",
  description:
    "Learn how Synapse AI uses advanced AI to search, analyze, and synthesize biomedical research from PubMed.",
}

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Enter Your Question",
    description:
      "Type a natural-language biomedical question. No need for Boolean operators or MeSH terms \u2014 Synapse AI understands clinical and research queries in plain English.",
    detail:
      "Our NLP layer parses intent, extracts biomedical entities (drugs, diseases, genes), and identifies the study type most relevant to your question.",
  },
  {
    number: "02",
    icon: BrainCircuit,
    title: "AI Query Decomposition",
    description:
      "Your question is automatically broken into optimized sub-queries. Each sub-query targets a different facet of your question for comprehensive coverage.",
    detail:
      "The decomposition engine generates parallel search strategies, including MeSH-expanded queries, free-text variants, and related concept queries to maximize recall.",
  },
  {
    number: "03",
    icon: Database,
    title: "PubMed Search & Retrieval",
    description:
      "Sub-queries are executed against PubMed\u2019s database of over 36 million biomedical citations. Results are de-duplicated and ranked by relevance.",
    detail:
      "We use the NCBI E-utilities API with automatic pagination, date filtering, and publication-type weighting to surface the most impactful evidence first.",
  },
  {
    number: "04",
    icon: SplitSquareVertical,
    title: "Evidence Grading & Filtering",
    description:
      "Each paper is classified by evidence level: meta-analyses and systematic reviews at the top, followed by RCTs, cohort studies, and narrative reviews.",
    detail:
      "Color-coded badges let you instantly see the strength of each source. Filter by evidence type, date range, or journal to focus your review.",
  },
  {
    number: "05",
    icon: FileText,
    title: "AI Synthesis & Citation",
    description:
      "A large language model reads the top-ranked abstracts and generates a structured, evidence-based answer with inline citations to every source.",
    detail:
      "The answer is streamed in real time, with markdown formatting for headings, bullet points, and bold text. Every claim links back to a specific PMID.",
  },
  {
    number: "06",
    icon: ShieldCheck,
    title: "Full Transparency",
    description:
      "Every search includes a transparency panel showing the exact sub-queries used, papers scanned, processing time, and the complete evidence pipeline.",
    detail:
      "You can export the answer and all citations in PDF, BibTeX, or RIS format for use in your manuscripts, systematic reviews, or grant applications.",
  },
]

const principles = [
  {
    title: "Evidence-First",
    description:
      "Every answer is grounded in peer-reviewed literature. We never hallucinate references \u2014 every citation maps to a real PubMed record.",
  },
  {
    title: "Transparent Pipeline",
    description:
      "See exactly how your results were generated. No black boxes \u2014 every step of the search and synthesis process is visible.",
  },
  {
    title: "Researcher-Grade",
    description:
      "Built for clinicians, researchers, and students who need reliable, citable evidence for real-world decisions.",
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="border-b border-border/50 px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <BrainCircuit className="size-3" />
              <span>Under the Hood</span>
            </div>
            <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              How Synapse AI Works
            </h1>
            <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              From natural-language question to evidence-based answer in seconds.
              Here is the six-step pipeline behind every search.
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="relative">
              {/* Vertical line connector */}
              <div className="absolute left-[23px] top-2 hidden h-[calc(100%-2rem)] w-px bg-border/60 sm:block" />

              <div className="flex flex-col gap-12 sm:gap-16">
                {steps.map((step, i) => (
                  <div key={step.number} className="group relative">
                    <div className="flex gap-5 sm:gap-8">
                      {/* Icon */}
                      <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                        <step.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-mono text-xs text-primary/60">
                            {step.number}
                          </span>
                          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                            {step.title}
                          </h2>
                        </div>
                        <p className="mb-3 leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                        <div className="rounded-lg border border-border/40 bg-secondary/30 px-4 py-3">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow connector between steps */}
                    {i < steps.length - 1 && (
                      <div className="ml-[18px] mt-4 hidden sm:block">
                        <ArrowRight className="size-3.5 rotate-90 text-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Principles Section */}
        <section className="border-t border-border/50 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Our Principles
            </h2>
            <p className="mx-auto mb-12 max-w-lg text-center text-muted-foreground">
              The values that guide how we build Synapse AI.
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              {principles.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/20"
                >
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/50 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-md text-center">
            <h2 className="mb-3 text-xl font-bold text-foreground sm:text-2xl">
              Ready to try it?
            </h2>
            <p className="mb-6 text-muted-foreground">
              Start your first AI-powered literature search in seconds.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Search className="size-4" />
              Start Searching
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
