import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-32">
      {/* Centered Content */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Ready to accelerate your research?
        </p>

        <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Try Synapse AI
          <br />
          today
        </h2>

        <p className="mx-auto mt-6 max-w-lg text-muted-foreground">
          Ask your first biomedical question and get an evidence-based answer
          in seconds. No signup required — just bring your free Gemini API key.
        </p>

        <Button
          size="lg"
          className="mt-8 bg-teal text-foreground hover:bg-teal-hover"
          asChild
        >
          <Link href="/search">Start searching</Link>
        </Button>
      </div>
    </section>
  )
}
