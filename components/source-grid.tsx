"use client"

import { useState, useMemo } from "react"
import { SourceCard } from "@/components/source-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText } from "lucide-react"
import type { Source } from "@/lib/types"

type SortOption = "relevance" | "year-desc" | "year-asc" | "study-type"
type FilterOption = "all" | string

const STUDY_TYPE_RANK: Record<string, number> = {
  "Meta-Analysis": 9,
  "Systematic Review": 8,
  "Randomized Controlled Trial": 7,
  "Clinical Trial": 6,
  "Controlled Clinical Trial": 6,
  "Review": 5,
  "Comparative Study": 4,
  "Observational Study": 4,
  "Multicenter Study": 3,
  "Case Reports": 2,
  "Journal Article": 1,
}

interface SourceGridProps {
  sources: Source[]
}

export function SourceGrid({ sources }: SourceGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")

  const availableTypes = useMemo(() => {
    const types = new Set(sources.map((s) => s.publication_type))
    return Array.from(types).sort()
  }, [sources])

  const filteredAndSorted = useMemo(() => {
    let result = [...sources]

    if (filterBy !== "all") {
      result = result.filter((s) => s.publication_type === filterBy)
    }

    switch (sortBy) {
      case "year-desc":
        result.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0))
        break
      case "year-asc":
        result.sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0))
        break
      case "study-type":
        result.sort(
          (a, b) =>
            (STUDY_TYPE_RANK[b.publication_type] ?? 0) -
            (STUDY_TYPE_RANK[a.publication_type] ?? 0)
        )
        break
      default:
        break
    }

    return result
  }, [sources, sortBy, filterBy])

  return (
    <div>
      {/* Header with controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Sources</h2>
          <span className="text-xs text-muted-foreground">
            ({filteredAndSorted.length} of {sources.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {availableTypes.length > 1 && (
            <Select
              value={filterBy}
              onValueChange={(v) => setFilterBy(v)}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="year-desc">Newest First</SelectItem>
              <SelectItem value="year-asc">Oldest First</SelectItem>
              <SelectItem value="study-type">Study Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card py-12 text-center">
          <FileText className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No papers match the current filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredAndSorted.map((source, idx) => (
            <SourceCard key={source.pmid} source={source} index={idx + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
