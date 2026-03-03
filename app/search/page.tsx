"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SearchInput } from "./components/search-input"
import { ResultsPanel } from "./components/results-panel"
import { SearchHistory } from "./components/search-history"
import { FollowUpInput } from "./components/follow-up-input"
import { LoadingProgress } from "./components/loading-progress"
import { Dna } from "lucide-react"
import { getHistory, addToHistory, clearHistory } from "@/lib/search-history"
import type { SearchSettings, SearchResult, HistoryEntry } from "@/lib/types"

export default function SearchPage() {
  const [settings, setSettings] = useState<SearchSettings>({
    apiKey: "",
    maxPapers: 8,
    sort: "relevance",
    dateRange: "all",
    studyTypeFilter: "all",
  })
  const [result, setResult] = useState<SearchResult | null>(null)
  const [lastQuery, setLastQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const [previousAnswer, setPreviousAnswer] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState<string | null>(null)

  const handleSearch = async (query: string, context?: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setLastQuery(query)
    setProgressStep(null)

    try {
      const response = await fetch("/api/search/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          api_key: settings.apiKey,
          max_papers: settings.maxPapers,
          sort: settings.sort,
          date_range: settings.dateRange,
          study_type_filter: settings.studyTypeFilter,
          context: context || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Search failed. Please try again.")
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let answer = ""
      let papersFound = 0
      let papersRetrieved = 0
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === "progress") {
              setProgressStep(event.step)
            } else if (event.type === "error") {
              setError(event.message)
              return
            } else if (event.type === "metadata") {
              papersFound = event.papers_found
              papersRetrieved = event.papers_retrieved
            } else if (event.type === "token") {
              answer += event.data
              setResult({
                answer,
                sources: [],
                papers_found: papersFound,
                papers_retrieved: papersRetrieved,
              })
            } else if (event.type === "sources") {
              const finalResult: SearchResult = {
                answer,
                sources: event.data,
                papers_found: papersFound,
                papers_retrieved: papersRetrieved,
              }
              setResult(finalResult)
              setPreviousAnswer(answer)
              addToHistory(query, finalResult)
              setHistory(getHistory())
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
      setProgressStep(null)
    }
  }

  const handleHistorySelect = (entry: HistoryEntry) => {
    setLastQuery(entry.query)
    setResult(entry.result)
    setError(null)
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10">
              <Dna className="h-6 w-6 text-teal" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Search biomedical literature
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ask a question and get an AI-synthesized answer grounded in PubMed research.
            </p>
          </div>

          {/* Search Input */}
          <SearchInput
            settings={settings}
            onSettingsChange={setSettings}
            onSearch={(q) => {
              setPreviousAnswer(null)
              handleSearch(q)
            }}
            isLoading={isLoading}
          />

          {/* Search History */}
          {!result && !isLoading && !error && (
            <SearchHistory
              history={history}
              onSelect={handleHistorySelect}
              onClear={handleClearHistory}
            />
          )}

          {/* Loading State */}
          {isLoading && !result && (
            <LoadingProgress currentStep={progressStep} />
          )}

          {/* Error State */}
          {error && (
            <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-8">
              <ResultsPanel result={result} query={lastQuery} />
            </div>
          )}

          {/* Follow-up Input */}
          {result && !isLoading && result.sources.length > 0 && (
            <div className="mt-6">
              <FollowUpInput
                onSubmit={(q) => handleSearch(q, previousAnswer || undefined)}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
