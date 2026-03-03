"use client"

import { Search, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"

interface SearchBarProps {
  onSearch: (query: string) => void
  isSearching?: boolean
  initialQuery?: string
  compact?: boolean
}

export function SearchBar({
  onSearch,
  isSearching = false,
  initialQuery = "",
  compact = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isSearching) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "group relative flex items-center rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(45,212,191,0.1)] hover:border-border",
          compact ? "h-11" : "h-12 sm:h-14"
        )}
      >
        <Search
          className={cn(
            "shrink-0 text-muted-foreground/60 transition-colors group-focus-within:text-primary",
            compact ? "ml-3.5 size-4" : "ml-4 size-4 sm:size-5"
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search biomedical literature with AI..."
          className={cn(
            "flex-1 border-0 bg-transparent px-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none",
            compact ? "text-sm" : "text-sm sm:text-base"
          )}
          disabled={isSearching}
        />
        <Button
          type="submit"
          disabled={!query.trim() || isSearching}
          size={compact ? "icon-sm" : "icon"}
          className={cn(
            "mr-1.5 shrink-0 rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40",
            compact ? "size-7" : "size-8 sm:size-10"
          )}
        >
          {isSearching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  )
}
