"use client"

import { SearchBar } from "@/components/search-bar"
import { exampleQueries } from "@/lib/mock-data"
import { Zap } from "lucide-react"

interface LandingHeroProps {
  onSearch: (query: string) => void
  isSearching?: boolean
}

export function LandingHero({ onSearch, isSearching }: LandingHeroProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Kicker */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="size-3" />
            <span>AI-Powered Research Engine</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="mb-3 text-balance text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          AI-Powered Biomedical Research
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-8 max-w-lg text-pretty text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
          Search millions of PubMed papers with AI. Get instant, evidence-based
          answers with full source transparency.
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={onSearch} isSearching={isSearching} />
        </div>

        {/* Example Query Pills */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            Try an example
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {exampleQueries.map((query) => (
              <button
                key={query}
                onClick={() => onSearch(query)}
                disabled={isSearching}
                className="rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
