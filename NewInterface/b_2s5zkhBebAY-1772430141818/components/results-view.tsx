"use client"

import { SearchBar } from "@/components/search-bar"
import { AIAnswerCard } from "@/components/ai-answer-card"
import { SearchTransparency } from "@/components/search-transparency"
import { SourceGrid } from "@/components/source-grid"
import type { Paper, PipelineStats } from "@/lib/types"

interface ResultsViewProps {
  query: string
  answer: string
  papers: Paper[]
  pipelineStats: PipelineStats
  isStreaming: boolean
  onNewSearch: (query: string) => void
}

export function ResultsView({
  query,
  answer,
  papers,
  pipelineStats,
  isStreaming,
  onNewSearch,
}: ResultsViewProps) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Sticky search bar */}
      <div className="sticky top-14 z-20 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto max-w-4xl">
          <SearchBar
            onSearch={onNewSearch}
            initialQuery={query}
            compact
          />
        </div>
      </div>

      {/* Results content */}
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-4">
          {/* AI Answer */}
          <AIAnswerCard answer={answer} isStreaming={isStreaming} />

          {/* Search Transparency */}
          <SearchTransparency stats={pipelineStats} />

          {/* Sources */}
          <SourceGrid papers={papers} />
        </div>
      </div>
    </div>
  )
}
