"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SearchInput } from "./components/search-input"
import { ResultsPanel } from "./components/results-panel"
import { Dna } from "lucide-react"
import type { SearchSettings, SearchResult } from "@/lib/types"

export default function SearchPage() {
  const [settings, setSettings] = useState<SearchSettings>({
    apiKey: "",
    maxPapers: 8,
    sort: "relevance",
    dateRange: "all",
  })
  const [result, setResult] = useState<SearchResult | null>(null)
  const [lastQuery, setLastQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setLastQuery(query)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          api_key: settings.apiKey,
          max_papers: settings.maxPapers,
          sort: settings.sort,
          date_range: settings.dateRange,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Search failed. Please try again.")
        return
      }

      setResult(data)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
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
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="mt-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Searching PubMed, fetching abstracts, and synthesizing your answer...
              </p>
            </div>
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
