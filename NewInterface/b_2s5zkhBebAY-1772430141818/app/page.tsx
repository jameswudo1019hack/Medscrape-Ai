"use client"

import { useState, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { SearchHistory } from "@/components/search-history"
import { LandingHero } from "@/components/landing-hero"
import { ResultsView } from "@/components/results-view"
import {
  mockPapers,
  mockSearchHistory,
  mockPipelineStats,
  mockAIAnswer,
} from "@/lib/mock-data"
import type { SearchQuery } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function Home() {
  const [view, setView] = useState<"landing" | "results">("landing")
  const [currentQuery, setCurrentQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [history, setHistory] = useState<SearchQuery[]>(mockSearchHistory)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSearch = useCallback(
    (query: string) => {
      setCurrentQuery(query)
      setIsSearching(true)

      // Add to history
      const newEntry: SearchQuery = {
        id: Date.now().toString(),
        query,
        timestamp: new Date(),
      }
      setHistory((prev) => [newEntry, ...prev])

      // Simulate search
      setTimeout(() => {
        setIsSearching(false)
        setIsStreaming(true)
        setView("results")

        // Update history with result count
        setHistory((prev) =>
          prev.map((h) =>
            h.id === newEntry.id
              ? { ...h, resultCount: mockPapers.length }
              : h
          )
        )

        // Simulate streaming complete
        setTimeout(() => {
          setIsStreaming(false)
        }, 4000)
      }, 1500)
    },
    []
  )

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <SearchHistory
        history={history}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelectQuery={handleSearch}
        onClearHistory={handleClearHistory}
      />

      <main
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        {view === "landing" ? (
          <LandingHero onSearch={handleSearch} isSearching={isSearching} />
        ) : (
          <ResultsView
            query={currentQuery}
            answer={mockAIAnswer}
            papers={mockPapers}
            pipelineStats={mockPipelineStats}
            isStreaming={isStreaming}
            onNewSearch={handleSearch}
          />
        )}
      </main>
    </div>
  )
}
