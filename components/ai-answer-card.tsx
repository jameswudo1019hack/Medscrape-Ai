"use client"

import { useState, useMemo } from "react"
import {
  Brain,
  FileDown,
  FileText,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import {
  sourcesToBibtex,
  sourcesToRis,
  downloadFile,
  formatReferences,
  REFERENCE_STYLES,
  type ReferenceStyle,
} from "@/lib/citation-export"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Source } from "@/lib/types"

interface AIAnswerCardProps {
  answer: string
  isStreaming?: boolean
  sources: Source[]
  query: string
  onExportPDF: () => void
  exporting?: boolean
  referenceStyle?: ReferenceStyle
  onReferenceStyleChange?: (style: ReferenceStyle) => void
}

/**
 * Convert PMID citations into numbered superscript badges.
 * Handles both single [PMID: 123] and grouped [PMID: 123, PMID: 456] formats.
 * Numbers match the source card index so citation [2] → source card #2.
 */
function processCitations(text: string, sources: Source[]): string {
  // Build PMID → 1-based source card index
  const pmidToIndex = new Map<string, number>()
  sources.forEach((s, i) => {
    if (!pmidToIndex.has(s.pmid)) {
      pmidToIndex.set(s.pmid, i + 1)
    }
  })

  function pmidBadge(pmid: string): string {
    const num = pmidToIndex.get(pmid)
    if (num !== undefined) {
      return `<sup class="citation-badge">${num}</sup>`
    }
    return `<sup class="citation-badge">?</sup>`
  }

  // First pass: handle grouped PMIDs — [PMID: 123, PMID: 456, PMID: 789]
  let result = text.replace(/\[PMID:\s*\d+(?:\s*,\s*PMID:\s*\d+)+\]/g, (match) => {
    const pmids = match.match(/\d{5,}/g) || []
    return pmids.map(pmid => pmidBadge(pmid)).join(" ")
  })

  // Second pass: handle single PMIDs — [PMID: 123]
  result = result.replace(/\[PMID:\s*(\d+)\]/g, (_, pmid) => pmidBadge(pmid))

  return result
}

export function AIAnswerCard({
  answer,
  isStreaming = false,
  sources,
  query,
  onExportPDF,
  exporting = false,
  referenceStyle = "vancouver",
  onReferenceStyleChange,
}: AIAnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [refCopied, setRefCopied] = useState(false)

  const refStyle = referenceStyle
  const setRefStyle = (style: ReferenceStyle) => {
    onReferenceStyleChange?.(style)
  }

  const processedAnswer = useMemo(() => processCitations(answer, sources), [answer, sources])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isComplete = !isStreaming && answer.length > 0

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1.5">
            <Brain className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              AI-Generated Answer
            </h2>
            {isStreaming && (
              <p className="text-xs text-primary">Analyzing sources...</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isComplete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Copy answer"
            >
              {copied ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="answer-prose">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-5 text-2xl font-bold tracking-tight text-foreground sm:text-[1.7rem]">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-8 text-[1.1rem] font-bold text-foreground">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-6 text-base font-bold text-foreground">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="mb-2 mt-5 text-[15px] font-semibold text-foreground">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="mb-4 text-[15px] leading-[1.8] text-foreground/75">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-5 ml-2 flex flex-col gap-3">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-5 ml-2 flex list-decimal flex-col gap-3 pl-5">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-[15px] leading-[1.8] text-foreground/75 [&::marker]:text-muted-foreground">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="text-foreground/70">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-4 border-l-2 border-primary/30 pl-4 text-[15px] leading-7 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                hr: () => (
                  <hr className="my-6 border-border/50" />
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60"
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-foreground/90">
                    {children}
                  </code>
                ),
              }}
            >
              {processedAnswer}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block h-5 w-0.5 animate-pulse bg-primary" />
            )}
          </div>

          {/* Export buttons row */}
          {isComplete && sources.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t border-border/50 pt-4">
              {/* References row — style selector + copy */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">References:</span>
                <Select
                  value={refStyle}
                  onValueChange={(v) => setRefStyle(v as ReferenceStyle)}
                >
                  <SelectTrigger className="h-7 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERENCE_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={async () => {
                    const text = formatReferences(sources, refStyle)
                    await navigator.clipboard.writeText(text)
                    setRefCopied(true)
                    setTimeout(() => setRefCopied(false), 2000)
                  }}
                >
                  {refCopied ? (
                    <Check className="size-3 text-primary" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {refCopied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => {
                    const text = formatReferences(sources, refStyle)
                    downloadFile(text, `medscrape-references-${refStyle}.txt`, "text/plain")
                  }}
                >
                  <FileDown className="size-3" />
                  .txt
                </Button>
              </div>
              {/* File export row — PDF, BibTeX, RIS */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Export:</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={onExportPDF}
                  disabled={exporting}
                >
                  <FileDown className="size-3" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => {
                    const content = sourcesToBibtex(sources)
                    downloadFile(content, "medscrape-references.bib", "application/x-bibtex")
                  }}
                >
                  <FileText className="size-3" />
                  BibTeX
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => {
                    const content = sourcesToRis(sources)
                    downloadFile(content, "medscrape-references.ris", "application/x-research-info-systems")
                  }}
                >
                  <BookOpen className="size-3" />
                  RIS
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
