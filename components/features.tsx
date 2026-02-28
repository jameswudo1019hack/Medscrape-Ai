import { Search, Brain, FileText, Settings, type LucideIcon } from "lucide-react"

const features: {
  title: string
  description: string
  icon: LucideIcon
  bgColor: string
  colSpan: string
  iconSize: string
}[] = [
  {
    title: "PubMed search",
    description:
      "Search over 36 million biomedical citations in real-time using NCBI's Entrez API. Find the most relevant abstracts for your research question.",
    icon: Search,
    bgColor: "bg-teal/10",
    colSpan: "",
    iconSize: "h-16 w-16",
  },
  {
    title: "RAG-powered answers",
    description:
      "Abstracts are embedded into a vector store and retrieved using semantic similarity. Google Gemini synthesizes a cited, structured answer from the evidence.",
    icon: Brain,
    bgColor: "bg-cyan-100",
    colSpan: "lg:col-span-2",
    iconSize: "h-20 w-20",
  },
  {
    title: "Citation tracking",
    description:
      "Every claim in the answer is traced back to specific PubMed papers with PMID references. View source abstracts, authors, journals, and direct PubMed links.",
    icon: FileText,
    bgColor: "bg-sky-100",
    colSpan: "lg:col-span-2",
    iconSize: "h-20 w-20",
  },
  {
    title: "Configurable search",
    description:
      "Control the number of papers retrieved, search strategy (relevance or recency), and bring your own Gemini API key for unlimited queries.",
    icon: Settings,
    bgColor: "bg-emerald-100",
    colSpan: "",
    iconSize: "h-16 w-16",
  },
]

export function Features() {
  return (
    <section id="features" className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need for literature research
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From real-time PubMed search to AI-synthesized answers — all the tools you need
            to accelerate your biomedical research workflow.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`overflow-hidden rounded-2xl border border-border/40 bg-card ${feature.colSpan}`}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <div className={`${feature.bgColor} flex items-center justify-center p-8`}>
                  <Icon className={`${feature.iconSize} text-teal`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
