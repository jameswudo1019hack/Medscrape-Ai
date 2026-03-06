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
import type { Paper } from "@/lib/types"

type SortOption = "relevance" | "year-desc" | "year-asc" | "citations"
type FilterOption = "all" | "meta-analysis" | "systematic-review" | "rct" | "clinical-trial" | "review" | "other"

interface SourceGridProps {
  papers: Paper[]
}

export function SourceGrid({ papers }: SourceGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")

  const filteredAndSorted = useMemo(() => {
    let result = [...papers]

    // Filter
    if (filterBy !== "all") {
      if (filterBy === "other") {
        result = result.filter(
          (p) =>
            !["meta-analysis", "systematic-review", "rct", "clinical-trial", "review"].includes(
              p.publicationType
            )
        )
      } else {
        result = result.filter((p) => p.publicationType === filterBy)
      }
    }

    // Sort
    switch (sortBy) {
      case "year-desc":
        result.sort((a, b) => b.year - a.year)
        break
      case "year-asc":
        result.sort((a, b) => a.year - b.year)
        break
      case "citations":
        result.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
        break
      default:
        break
    }

    return result
  }, [papers, sortBy, filterBy])

  return (
    <div>
      {/* Header with controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Sources
          </h2>
          <span className="text-xs text-muted-foreground">
            ({filteredAndSorted.length} of {papers.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filterBy}
            onValueChange={(v) => setFilterBy(v as FilterOption)}
          >
            <SelectTrigger size="sm" className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="meta-analysis">Meta-Analysis</SelectItem>
              <SelectItem value="systematic-review">Systematic Review</SelectItem>
              <SelectItem value="rct">RCT</SelectItem>
              <SelectItem value="clinical-trial">Clinical Trial</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="year-desc">Newest First</SelectItem>
              <SelectItem value="year-asc">Oldest First</SelectItem>
              <SelectItem value="citations">Most Cited</SelectItem>
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
          {filteredAndSorted.map((paper, idx) => (
            <SourceCard key={paper.id} paper={paper} index={idx + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
