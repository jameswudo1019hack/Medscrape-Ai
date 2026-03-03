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
  Layers,
  RefreshCw,
  CheckCircle,
  Sparkles,
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How It Works - MedScrape",
  description:
    "Learn how MedScrape uses advanced AI to search, analyze, and synthesize biomedical research from PubMed.",
}

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Enter Your Question",
    description:
      "Type a natural-language biomedical question. No need for Boolean operators or MeSH terms \u2014 MedScrape understands clinical and research queries in plain English.",
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
              How MedScrape Works
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
              <div className="absolute left-[23px] top-2 hidden h-[calc(100%-2rem)] w-px bg-border/60 sm:block" />

              <div className="flex flex-col gap-12 sm:gap-16">
                {steps.map((step, i) => (
                  <div key={step.number} className="group relative">
                    <div className="flex gap-5 sm:gap-8">
                      <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                        <step.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>

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

        {/* Research Modes Section */}
        <section className="border-t border-border/50 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Layers className="size-3" />
              <span>Research Modes</span>
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Standard vs Deep Research
            </h2>
            <p className="mb-10 text-muted-foreground">
              Choose the right mode based on the complexity of your question.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Standard Mode */}
              <div className="rounded-xl border border-border/60 bg-card p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                    <Search className="size-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">Standard Mode</h3>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  A single-pass pipeline optimised for speed. Best for focused, well-defined questions where you know what you are looking for.
                </p>
                <div className="space-y-2.5">
                  {[
                    "Decompose into sub-queries",
                    "MeSH term expansion",
                    "Parallel PubMed search",
                    "Hybrid retrieval (BM25 + BERT)",
                    "PMC full-text enrichment",
                    "RAG answer synthesis",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deep Research Mode */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <BrainCircuit className="size-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Deep Research Mode</h3>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  An iterative AI agent that keeps searching until it is confident it has covered all aspects of your question. Best for broad or multi-faceted topics.
                </p>
                <div className="space-y-2.5">
                  {[
                    { icon: BrainCircuit, label: "Plan — decompose into aspects" },
                    { icon: Search, label: "Search — parallel PubMed + MeSH" },
                    { icon: CheckCircle, label: "Evaluate — identify coverage gaps" },
                    { icon: RefreshCw, label: "Refine — targeted follow-up queries" },
                    { icon: Search, label: "Search again for missing aspects" },
                    { icon: Sparkles, label: "Synthesize — comprehensive answer" },
                  ].map(({ icon: Icon, label }, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10">
                        <Icon className="size-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary/80">
                  Runs up to 2 refinement cycles. Takes ~2× longer but retrieves significantly more evidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Evidence Grading Section */}
        <section className="border-t border-border/50 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3" />
              <span>Evidence Quality</span>
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              How Papers Are Graded A–D
            </h2>
            <p className="mb-10 text-muted-foreground">
              Every paper is automatically scored on five criteria, inspired by the Oxford Centre for Evidence-Based Medicine (CEBM) framework.
            </p>

            {/* Grade cards */}
            <div className="mb-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  grade: "A",
                  label: "High Quality",
                  score: "Score ≥ 75",
                  className: "border-emerald-500/30 bg-emerald-500/5",
                  badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
                  examples: "Meta-analyses, large systematic reviews, large RCTs with CONSORT reporting",
                },
                {
                  grade: "B",
                  label: "Moderate Quality",
                  score: "Score 50–74",
                  className: "border-blue-500/30 bg-blue-500/5",
                  badgeClass: "bg-blue-500/15 text-blue-600 border-blue-500/30",
                  examples: "Small RCTs, prospective cohort studies, well-reported observational studies",
                },
                {
                  grade: "C",
                  label: "Low Quality",
                  score: "Score 25–49",
                  className: "border-amber-500/30 bg-amber-500/5",
                  badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
                  examples: "Case-control studies, cross-sectional studies, older retrospective analyses",
                },
                {
                  grade: "D",
                  label: "Very Low Quality",
                  score: "Score < 25",
                  className: "border-slate-500/30 bg-slate-500/5",
                  badgeClass: "bg-slate-500/15 text-slate-500 border-slate-500/30",
                  examples: "Case reports, expert opinion, editorial letters, conference abstracts",
                },
              ].map(({ grade, label, score, className, badgeClass, examples }) => (
                <div key={grade} className={`rounded-xl border p-5 ${className}`}>
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold ${badgeClass}`}>
                      Grade {grade}
                    </span>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{score}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{examples}</p>
                </div>
              ))}
            </div>

            {/* Scoring factors */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Scoring Factors (100 points total)</h3>
              <div className="space-y-3">
                {[
                  { factor: "Study Design", weight: "40 pts", description: "Meta-analysis > Systematic Review > RCT > Cohort > Case-Control > Case Report" },
                  { factor: "Recency", weight: "20 pts", description: "Papers from the last 2 years score highest; older papers decay gradually over 10+ years" },
                  { factor: "Journal Prestige", weight: "15 pts", description: "Presence of a DOI and known high-impact journal name patterns" },
                  { factor: "Sample Size", weight: "15 pts", description: "Extracted from abstract (e.g. \"n=1,234\", \"1234 patients\"); larger = higher score" },
                  { factor: "Reporting Quality", weight: "10 pts", description: "Keywords like PRISMA, CONSORT, STROBE, pre-registered, confidence interval" },
                ].map(({ factor, weight, description }) => (
                  <div key={factor} className="flex gap-3">
                    <div className="w-32 shrink-0">
                      <p className="text-xs font-medium text-foreground">{factor}</p>
                      <p className="font-mono text-[10px] text-primary">{weight}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
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
              The values that guide how we build MedScrape.
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
