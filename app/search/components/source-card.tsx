import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import type { Source } from "@/lib/types"

interface SourceCardProps {
  source: Source
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 transition-colors hover:border-teal/40">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold leading-snug">{source.title}</h4>
        <Badge variant="outline" className="shrink-0 text-xs">
          PMID: {source.pmid}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{source.authors || "Unknown authors"}</span>
        {source.journal && (
          <>
            <span className="h-3 w-px bg-border" />
            <span>{source.journal}</span>
          </>
        )}
        {source.year && (
          <>
            <span className="h-3 w-px bg-border" />
            <span>{source.year}</span>
          </>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {source.abstract_snippet}...
      </p>

      <a
        href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm text-teal transition-colors hover:text-teal-hover"
      >
        View on PubMed
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}
