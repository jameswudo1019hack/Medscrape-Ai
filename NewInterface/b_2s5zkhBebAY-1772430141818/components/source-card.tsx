"use client"

import { useState } from "react"
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Quote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Paper } from "@/lib/types"
import { cn } from "@/lib/utils"

const pubTypeConfig: Record<
  string,
  { label: string; className: string }
> = {
  "meta-analysis": {
    label: "Meta-Analysis",
    className: "bg-teal/15 text-teal border-teal/25",
  },
  "systematic-review": {
    label: "Systematic Review",
    className: "bg-teal/15 text-teal border-teal/25",
  },
  rct: {
    label: "RCT",
    className: "bg-violet/15 text-violet border-violet/25",
  },
  "clinical-trial": {
    label: "Clinical Trial",
    className: "bg-violet/15 text-violet border-violet/25",
  },
  review: {
    label: "Review",
    className: "bg-sky/15 text-sky border-sky/25",
  },
  "cohort-study": {
    label: "Cohort Study",
    className: "border-border bg-secondary text-muted-foreground",
  },
  "case-report": {
    label: "Case Report",
    className: "border-border bg-secondary text-muted-foreground",
  },
  editorial: {
    label: "Editorial",
    className: "border-border bg-secondary text-muted-foreground",
  },
}

interface SourceCardProps {
  paper: Paper
  index: number
}

export function SourceCard({ paper, index }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const config = pubTypeConfig[paper.publicationType] || pubTypeConfig["editorial"]

  const handleCite = async () => {
    const citation = `${paper.authors.join(", ")}. ${paper.title}. ${paper.journal}. ${paper.year}. DOI: ${paper.doi}`
    await navigator.clipboard.writeText(citation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group rounded-xl border border-border/50 bg-card transition-all duration-200 hover:border-border hover:shadow-sm">
      <div className="px-4 py-4 sm:px-5">
        {/* Top row: index, badges */}
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded bg-secondary text-xs font-medium text-muted-foreground">
            {index}
          </span>
          <Badge
            variant="outline"
            className="font-mono text-[10px] border-primary/20 bg-primary/5 text-primary"
          >
            PMID: {paper.pmid}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", config.className)}>
            {config.label}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground">
          {paper.title}
        </h3>

        {/* Authors */}
        <p className="mb-1.5 text-xs leading-relaxed text-muted-foreground">
          {paper.authors.join(", ")}
        </p>

        {/* Journal / Year */}
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {paper.journal}
          </span>
          <span className="text-border">{"/"}</span>
          <span>{paper.year}</span>
          {paper.citationCount && (
            <>
              <span className="text-border">{"/"}</span>
              <span>{paper.citationCount} citations</span>
            </>
          )}
        </div>

        {/* Abstract toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-3 flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="size-3" />
              Hide abstract
            </>
          ) : (
            <>
              <ChevronDown className="size-3" />
              Show abstract
            </>
          )}
        </button>

        {isExpanded && (
          <div className="mb-3 rounded-lg bg-secondary/50 px-3 py-3">
            <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
              {paper.abstract}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            DOI
            <ExternalLink className="size-3" />
          </a>
          <span className="text-border">{"/"}</span>
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
          >
            View on PubMed
            <ExternalLink className="size-3" />
          </a>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCite}
              className="h-7 gap-1.5 text-xs"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-primary" />
                  Copied
                </>
              ) : (
                <>
                  <Quote className="size-3" />
                  Cite
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
