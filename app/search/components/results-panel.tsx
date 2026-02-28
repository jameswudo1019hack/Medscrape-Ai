import ReactMarkdown from "react-markdown"
import { SourceCard } from "./source-card"
import type { SearchResult } from "@/lib/types"

interface ResultsPanelProps {
  result: SearchResult
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="space-y-8">
      {/* Answer Card */}
      <div className="rounded-xl border border-border/40 bg-card">
        <div className="border-l-4 border-teal p-6">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Answer
          </h3>
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
            <ReactMarkdown>{result.answer}</ReactMarkdown>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span>{result.papers_found} papers found</span>
            <span className="h-3 w-px bg-border" />
            <span>{result.papers_retrieved} abstracts retrieved</span>
            <span className="h-3 w-px bg-border" />
            <span>{result.sources.length} sources cited</span>
          </div>
        </div>
      </div>

      {/* Sources Grid */}
      {result.sources.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Sources ({result.sources.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {result.sources.map((source) => (
              <SourceCard key={source.pmid} source={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
