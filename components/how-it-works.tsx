import { Search, Download, Database, Sparkles } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Search PubMed",
    description:
      "Your query is sent to NCBI's Entrez API, returning the most relevant paper IDs from over 36 million biomedical citations.",
  },
  {
    number: "02",
    icon: Download,
    title: "Fetch abstracts",
    description:
      "Full abstract data is retrieved for each paper — including title, authors, journal, year, and the complete abstract text.",
  },
  {
    number: "03",
    icon: Database,
    title: "Embed into vector store",
    description:
      "Abstracts are chunked, embedded with Google's embedding model, and indexed in a ChromaDB vector store for semantic retrieval.",
  },
  {
    number: "04",
    icon: Sparkles,
    title: "Synthesize answer",
    description:
      "The most relevant chunks are retrieved and fed to Google Gemini, which generates a structured, cited answer grounded in the literature.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Four steps from question to evidence-based answer
          </p>
        </div>

        <div className="relative mt-12">
          {/* Connection Line (visible on md+) */}
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-border md:block" />

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Icon Circle */}
                <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-border bg-background">
                  <step.icon className="h-10 w-10 text-muted-foreground" />
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-teal text-xs font-bold">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
