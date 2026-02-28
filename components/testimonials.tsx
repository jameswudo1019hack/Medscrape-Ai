import { User } from "lucide-react"

const testimonials = [
  {
    quote:
      "Synapse AI saved me hours of manual literature review. I asked a question about CRISPR delivery mechanisms and got a comprehensive, cited answer in under 30 seconds.",
    name: "James Wu",
    role: "Biomedical Engineering Student",
  },
  {
    quote:
      "The citation tracking is what sets this apart. Every claim links back to real PubMed papers, so I can verify the evidence and dive deeper when needed.",
    name: "Uzair Waraich",
    role: "Medical Research Assistant",
  },
]

export function Testimonials() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Trusted by
            <br />
            researchers
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            See how students and researchers use Synapse AI to accelerate their
            literature reviews and stay on top of the latest evidence.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="space-y-6">
              <blockquote className="text-xl font-medium leading-relaxed md:text-2xl">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
