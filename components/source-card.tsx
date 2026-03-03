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
import type { Source } from "@/lib/types"
import { cn } from "@/lib/utils"

const gradeConfig: Record<string, { label: string; className: string; description: string }> = {
  A: {
    label: "Grade A",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 dark:text-emerald-400",
    description: "High-quality evidence (meta-analysis, large RCT)",
  },
  B: {
    label: "Grade B",
    className: "bg-blue-500/15 text-blue-600 border-blue-500/25 dark:text-blue-400",
    description: "Moderate-quality evidence",
  },
  C: {
    label: "Grade C",
    className: "bg-amber-500/15 text-amber-600 border-amber-500/25 dark:text-amber-400",
    description: "Low-quality evidence",
  },
  D: {
    label: "Grade D",
    className: "bg-slate-500/15 text-slate-500 border-slate-500/25",
    description: "Very low-quality evidence",
  },
}

const pubTypeConfig: Record<string, { label: string; className: string }> = {
  "Meta-Analysis": {
    label: "Meta-Analysis",
    className: "bg-teal/15 text-teal border-teal/25",
  },
  "Systematic Review": {
    label: "Systematic Review",
    className: "bg-teal/15 text-teal border-teal/25",
  },
  "Randomized Controlled Trial": {
    label: "RCT",
    className: "bg-violet/15 text-violet border-violet/25",
  },
  "Clinical Trial": {
    label: "Clinical Trial",
    className: "bg-violet/15 text-violet border-violet/25",
  },
  "Controlled Clinical Trial": {
    label: "Clinical Trial",
    className: "bg-violet/15 text-violet border-violet/25",
  },
  "Review": {
    label: "Review",
    className: "bg-sky/15 text-sky border-sky/25",
  },
}

const defaultConfig = {
  label: "",
  className: "border-border bg-secondary text-muted-foreground",
}

interface SourceCardProps {
  source: Source
  index: number
}

export function SourceCard({ source, index }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const config = pubTypeConfig[source.publication_type] || defaultConfig
  const showBadge = source.publication_type && source.publication_type !== "Journal Article"
  const grade = source.evidence_grade ? gradeConfig[source.evidence_grade.grade] : null

  const handleCite = async () => {
    const authors = source.authors || "Unknown authors"
    const year = source.year || "n.d."
    const title = source.title.endsWith(".") ? source.title : `${source.title}.`
    const journal = source.journal ? `${source.journal}.` : ""
    const doi = source.doi ? ` DOI: ${source.doi}` : ""
    const citation = `${authors} (${year}). ${title} ${journal} PMID: ${source.pmid}${doi}`
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
            PMID: {source.pmid}
          </Badge>
          {showBadge && (
            <Badge variant="outline" className={cn("text-[10px]", config.className)}>
              {config.label || source.publication_type}
            </Badge>
          )}
          {grade && (
            <Badge
              variant="outline"
              className={cn("text-[10px] font-semibold", grade.className)}
              title={`${grade.description} (score: ${source.evidence_grade!.score}/100)`}
            >
              {grade.label}
            </Badge>
          )}
          {source.has_full_text && (
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
              Full Text
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground">
          {source.title}
        </h3>

        {/* Authors */}
        <p className="mb-1.5 text-xs leading-relaxed text-muted-foreground">
          {source.authors || "Unknown authors"}
        </p>

        {/* Journal / Year */}
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {source.journal && (
            <span className="font-medium text-foreground/80">
              {source.journal}
            </span>
          )}
          {source.year && (
            <>
              <span className="text-border">/</span>
              <span>{source.year}</span>
            </>
          )}
        </div>

        {/* Abstract toggle */}
        {source.abstract && source.abstract.length > 0 && (
          <>
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
                  {source.abstract}
                </p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {source.doi && (
            <>
              <a
                href={`https://doi.org/${source.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                DOI
                <ExternalLink className="size-3" />
              </a>
              <span className="text-border">/</span>
            </>
          )}
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`}
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
