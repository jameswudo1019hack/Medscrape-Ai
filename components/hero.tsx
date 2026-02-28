import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-frost py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
            <span>Powered by PubMed + Gemini</span>
            <span className="h-4 w-px bg-border" />
            <a
              href="#features"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              See features
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Research answers, grounded in evidence
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Ask biomedical questions and get AI-synthesized answers backed by real
            PubMed literature — with full citations, source tracking, and
            configurable search parameters.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-teal text-foreground hover:bg-teal-hover"
              asChild
            >
              <Link href="/search">Start searching</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
