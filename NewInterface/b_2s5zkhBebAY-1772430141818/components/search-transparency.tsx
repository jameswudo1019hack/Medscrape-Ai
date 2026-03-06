"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Database,
  Clock,
  Search,
  CheckCircle2,
  Loader2,
  CircleDashed,
  Filter,
} from "lucide-react"
import type { PipelineStats } from "@/lib/types"

interface SearchTransparencyProps {
  stats: PipelineStats
}

export function SearchTransparency({ stats }: SearchTransparencyProps) {
  const [isOpen, setIsOpen] = useState(false)

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="size-3.5 text-primary" />
      case "running":
        return <Loader2 className="size-3.5 animate-spin text-primary" />
      case "pending":
        return <CircleDashed className="size-3.5 text-muted-foreground" />
      default:
        return null
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-lg bg-secondary p-1.5">
            <Filter className="size-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Search Transparency
            </h3>
            <p className="text-xs text-muted-foreground">
              {stats.totalPapersScanned.toLocaleString()} papers scanned
              {" / "}
              {stats.relevantPapersFound} relevant
              {" / "}
              {stats.aiProcessingTime}s processing
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 sm:px-5">
          {/* Stats bar */}
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Database className="size-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Papers Scanned</p>
                <p className="text-sm font-semibold text-foreground">
                  {stats.totalPapersScanned.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Search className="size-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Relevant Found</p>
                <p className="text-sm font-semibold text-foreground">
                  {stats.relevantPapersFound}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">AI Processing</p>
                <p className="text-sm font-semibold text-foreground">
                  {stats.aiProcessingTime}s
                </p>
              </div>
            </div>
          </div>

          {/* Sub-queries */}
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sub-queries Generated
            </h4>
            <div className="flex flex-col gap-1.5">
              {stats.subQueries.map((sq) => (
                <div
                  key={sq.id}
                  className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  {statusIcon(sq.status)}
                  <p className="flex-1 truncate text-xs text-foreground font-mono">
                    {sq.query}
                  </p>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {sq.resultCount} hits
                    </span>
                    {sq.duration && (
                      <span className="text-xs text-muted-foreground">
                        {sq.duration}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
