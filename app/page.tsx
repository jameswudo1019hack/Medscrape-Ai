"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SearchHistory } from "@/components/search-history"
import { LandingHero } from "@/components/landing-hero"
import { SearchBar } from "@/components/search-bar"
import { AIAnswerCard } from "@/components/ai-answer-card"
import { SearchTransparency } from "@/components/search-transparency"
import { SourceGrid } from "@/components/source-grid"
import { AgentReasoning, type AgentReasoningStep } from "@/components/agent-reasoning"
import { LoadingProgress } from "./search/components/loading-progress"
import { FollowUpInput } from "./search/components/follow-up-input"
import { SearchSettingsPanel } from "./search/components/search-settings"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { getHistory, addToHistory, clearHistory } from "@/lib/search-history"
import { cn } from "@/lib/utils"
import type { SearchSettings, SearchResult, HistoryEntry, TransparencyData } from "@/lib/types"

export default function Home() {
  const [view, setView] = useState<"landing" | "results">("landing")
  const [settings, setSettings] = useState<SearchSettings>({
    apiKey: "",
    maxPapers: 15,
    sort: "relevance",
    dateRange: "all",
    studyTypeFilter: "all",
    referenceStyle: "vancouver",
    researchDepth: "standard",
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [lastQuery, setLastQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [previousAnswer, setPreviousAnswer] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState<string | null>(null)
  const [transparency, setTransparency] = useState<TransparencyData | null>(null)
  const [exporting, setExporting] = useState(false)
  const [agentSteps, setAgentSteps] = useState<AgentReasoningStep[]>([])
  const [isDeepResearch, setIsDeepResearch] = useState(false)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  // Load persisted settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("medscrape-settings")
      if (saved) setSettings(JSON.parse(saved))
    } catch {}
  }, [])

  // Persist settings whenever they change, skipping the initial default render
  const isFirstSettingsRender = useRef(true)
  useEffect(() => {
    if (isFirstSettingsRender.current) {
      isFirstSettingsRender.current = false
      return
    }
    try {
      localStorage.setItem("medscrape-settings", JSON.stringify(settings))
    } catch {}
  }, [settings])

  const handleSearch = useCallback(
    async (query: string, context?: string) => {
      if (!settings.apiKey.trim()) {
        setSettingsOpen(true)
        setError("Please add your Google Gemini API key in settings before searching.")
        setLastQuery(query)
        setView("results")
        return
      }

      const useDeepResearch = settings.researchDepth === "deep"
      setIsSearching(true)
      setIsDeepResearch(useDeepResearch)
      setError(null)
      setResult(null)
      setLastQuery(query)
      setProgressStep(null)
      setTransparency(null)
      setAgentSteps([])
      setView("results")

      const endpoint = useDeepResearch ? "/api/search/agent-stream" : "/api/search/stream"

      try {
        const response = await fetch(endpoint, {
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
              } else if (event.type === "answer_replace") {
                // Citation verification corrected the answer
                answer = event.data
                setResult({
                  answer,
                  sources: [],
                  papers_found: papersFound,
                  papers_retrieved: papersRetrieved,
                })
              } else if (event.type === "transparency") {
                setTransparency((prev) => ({
                  subQueries: event.sub_queries ?? prev?.subQueries ?? [],
                  totalPapersFound: event.total_papers_found ?? prev?.totalPapersFound ?? 0,
                  papersWithAbstracts: event.papers_with_abstracts ?? prev?.papersWithAbstracts ?? 0,
                  papersAfterFiltering: event.papers_after_filtering ?? prev?.papersAfterFiltering ?? 0,
                  meshMappings: event.mesh_mappings ?? prev?.meshMappings,
                  evidenceGrades: event.evidence_grades ?? prev?.evidenceGrades,
                }))
              } else if (event.type === "agent_reasoning") {
                setAgentSteps((prev) => [...prev, {
                  step: event.step,
                  action: event.action,
                  result: event.result,
                }])
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
        setIsSearching(false)
        setProgressStep(null)
      }
    },
    [settings]
  )

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setLastQuery(entry.query)
    setResult(entry.result)
    setError(null)
    setView("results")
  }, [])

  const handleClearHistory = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

  const handleExportPDF = async () => {
    if (!result) return
    setExporting(true)
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: lastQuery,
          answer: result.answer,
          sources: result.sources,
        }),
      })
      if (!response.ok) return
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "medscrape-report.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const isStreaming = isSearching && result !== null && result.sources.length === 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <SearchHistory
        history={history}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelectEntry={handleHistorySelect}
        onClearHistory={handleClearHistory}
      />

      <main
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        {view === "landing" ? (
          <>
            <LandingHero
              onSearch={(q) => {
                setPreviousAnswer(null)
                handleSearch(q)
              }}
              isSearching={isSearching}
            />

            {/* Settings — shown on landing */}
            <div className="mx-auto max-w-2xl px-4 pb-12">
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <div className="flex justify-center">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                      <Settings className="h-4 w-4" />
                      {settingsOpen ? "Hide settings" : "Search settings"}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-3 rounded-xl border border-border/50 bg-card p-4">
                  <SearchSettingsPanel
                    settings={settings}
                    onChange={setSettings}
                  />
                </CollapsibleContent>
              </Collapsible>
              {!settings.apiKey.trim() && (
                <p className="mt-3 text-center text-sm text-destructive">
                  Please add your Google Gemini API key in settings before searching.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="min-h-[calc(100vh-3.5rem)]">
            {/* Sticky search bar */}
            <div className="sticky top-14 z-20 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl lg:px-6">
              <div className="mx-auto flex max-w-4xl items-center gap-2">
                <div className="flex-1">
                  <SearchBar
                    onSearch={(q) => {
                      setPreviousAnswer(null)
                      handleSearch(q)
                    }}
                    initialQuery={lastQuery}
                    compact
                    isSearching={isSearching}
                  />
                </div>
                <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground shrink-0">
                      <Settings className="size-4" />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </div>
              {settingsOpen && (
                <div className="mx-auto mt-3 max-w-4xl rounded-xl border border-border/50 bg-card p-4">
                  <SearchSettingsPanel settings={settings} onChange={setSettings} />
                </div>
              )}
            </div>

            {/* Results content */}
            <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
              <div className="flex flex-col gap-4">
                {/* Loading State */}
                {isSearching && !result && (
                  <LoadingProgress currentStep={progressStep} />
                )}

                {/* Error State */}
                {error && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {/* Agent Reasoning (Deep Research) */}
                {isDeepResearch && (agentSteps.length > 0 || isSearching) && (
                  <AgentReasoning steps={agentSteps} isRunning={isSearching} />
                )}

                {/* AI Answer */}
                {result && (
                  <AIAnswerCard
                    answer={result.answer}
                    isStreaming={isStreaming}
                    sources={result.sources}
                    query={lastQuery}
                    onExportPDF={handleExportPDF}
                    exporting={exporting}
                    referenceStyle={settings.referenceStyle}
                    onReferenceStyleChange={(style) =>
                      setSettings((s) => ({ ...s, referenceStyle: style }))
                    }
                  />
                )}

                {/* Search Transparency */}
                {transparency && result && (
                  <SearchTransparency
                    data={transparency}
                    sourcesShown={result.sources.length}
                  />
                )}

                {/* Sources */}
                {result && result.sources.length > 0 && (
                  <SourceGrid sources={result.sources} />
                )}

                {/* Follow-up Input */}
                {result && !isSearching && result.sources.length > 0 && (
                  <FollowUpInput
                    onSubmit={(q) => handleSearch(q, previousAnswer || undefined)}
                    isLoading={isSearching}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {view === "landing" && <Footer />}
    </div>
  )
}
