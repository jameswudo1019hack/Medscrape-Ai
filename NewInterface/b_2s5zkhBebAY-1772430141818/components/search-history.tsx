"use client"

import { Clock, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SearchQuery } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

interface SearchHistoryProps {
  history: SearchQuery[]
  isOpen: boolean
  onToggle: () => void
  onSelectQuery: (query: string) => void
  onClearHistory: () => void
}

export function SearchHistory({
  history,
  isOpen,
  onToggle,
  onSelectQuery,
  onClearHistory,
}: SearchHistoryProps) {
  return (
    <>
      {/* Toggle button - always visible */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        className={cn(
          "fixed left-3 top-16 z-40 rounded-full border border-border/50 bg-card text-muted-foreground shadow-sm hover:text-foreground",
          isOpen && "left-[252px]"
        )}
        aria-label={isOpen ? "Close history" : "Open history"}
      >
        {isOpen ? (
          <ChevronLeft className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-border/50 bg-card transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="size-4 text-muted-foreground" />
            <span>Search History</span>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClearHistory}
              className="size-7 text-muted-foreground hover:text-destructive-foreground"
              aria-label="Clear history"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Search className="size-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                Your search history will appear here
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 p-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectQuery(item.query)}
                  className="group flex flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <p className="line-clamp-2 text-sm text-foreground group-hover:text-accent-foreground">
                    {item.query}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatTimestamp(item.timestamp)}</span>
                    {item.resultCount && (
                      <>
                        <span className="text-border">{"/"}</span>
                        <span>{item.resultCount} results</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>
    </>
  )
}
