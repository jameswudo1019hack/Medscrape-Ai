import { Button } from "@/components/ui/button"

const faqs = [
  {
    question: "What data sources does Synapse AI use?",
    answer:
      "Synapse AI searches PubMed, which contains over 36 million biomedical citations and abstracts from MEDLINE, life science journals, and online books. All data comes directly from NCBI's Entrez E-utilities API.",
  },
  {
    question: "Do I need an API key?",
    answer:
      "Yes, you need a free Google Gemini API key to use the search tool. You can get one instantly at Google AI Studio — no credit card required. Your key is never stored on our servers.",
  },
  {
    question: "How accurate are the answers?",
    answer:
      "Answers are grounded in real PubMed abstracts and include PMID citations for verification. However, like any AI tool, results should be treated as a research starting point, not a definitive source. Always verify critical claims.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. Your API key is used only for the current session and is never stored. Vector stores are cleaned up after each query. We don't log queries or track usage.",
  },
  {
    question: "What are the limitations?",
    answer:
      "Synapse AI only searches PubMed abstracts (not full-text articles). Answer quality depends on the availability and relevance of abstracts for your query. Complex clinical questions may need expert interpretation.",
  },
  {
    question: "Is Synapse AI free to use?",
    answer:
      "Yes, Synapse AI is completely free and open-source. The only requirement is a Google Gemini API key, which is also free for standard usage. PubMed access requires no authentication.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="bg-frost py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Frequently asked
            <br />
            questions
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Everything you need to know about using Synapse AI for your biomedical
            research. Can&apos;t find what you&apos;re looking for? Reach out to us.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="border-l-2 border-border pl-6">
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* Help CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Still have questions? Check out the source code or open an issue.
          </p>
          <Button variant="outline" className="mt-4 rounded-full bg-transparent">
            View on GitHub
          </Button>
        </div>
      </div>
    </section>
  )
}
