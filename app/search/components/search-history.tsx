"use client"

import { Clock, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HistoryEntry } from "@/lib/types"

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface SearchHistoryProps {
  history: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onClear: () => void
}

export function SearchHistory({ history, onSelect, onClear }: SearchHistoryProps) {
  if (history.length === 0) return null

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Recent searches
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          onClick={onClear}
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>
      <div className="space-y-2">
        {history.slice(0, 10).map((entry) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            className="flex w-full items-start gap-3 rounded-lg border border-border/40 bg-card p-3 text-left transition-colors hover:border-teal/40 hover:bg-frost/50"
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.query}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {entry.paperCount} sources &middot; {timeAgo(entry.timestamp)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
