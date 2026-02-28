"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { SourceCard } from "./source-card"
import type { SearchResult } from "@/lib/types"

interface ResultsPanelProps {
  result: SearchResult
  query: string
}

export function ResultsPanel({ result, query }: ResultsPanelProps) {
  const [exporting, setExporting] = useState(false)

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          answer: result.answer,
          sources: result.sources,
        }),
      })

      if (!response.ok) return

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "synapse-report.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Answer Card */}
      <div className="rounded-xl border border-border/40 bg-card">
        <div className="border-l-4 border-teal p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Answer
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportPDF}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export PDF
            </Button>
          </div>
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
