"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Database,
  Search,
  Filter,
  FileText,
  Shield,
} from "lucide-react"
import type { TransparencyData } from "@/lib/types"

interface SearchTransparencyProps {
  data: TransparencyData
  sourcesShown: number
}

export function SearchTransparency({ data, sourcesShown }: SearchTransparencyProps) {
  const [isOpen, setIsOpen] = useState(false)

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
              {data.totalPapersFound} papers found
              {" / "}
              {data.papersWithAbstracts} with abstracts
              {" / "}
              {sourcesShown} shown
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
                <p className="text-xs text-muted-foreground">Papers Found</p>
                <p className="text-sm font-semibold text-foreground">
                  {data.totalPapersFound}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Search className="size-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">With Abstracts</p>
                <p className="text-sm font-semibold text-foreground">
                  {data.papersWithAbstracts}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">After Filtering</p>
                <p className="text-sm font-semibold text-foreground">
                  {data.papersAfterFiltering}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="size-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Sources Shown</p>
                <p className="text-sm font-semibold text-foreground">
                  {sourcesShown}
                </p>
              </div>
            </div>
          </div>

          {/* Evidence grade distribution */}
          {data.evidenceGrades && Object.keys(data.evidenceGrades).length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Evidence Quality
              </h4>
              <div className="mb-2 flex flex-wrap gap-2">
                {(["A", "B", "C", "D"] as const).map((grade) => {
                  const count = data.evidenceGrades![grade] ?? 0
                  if (count === 0) return null
                  const colors: Record<string, string> = {
                    A: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",
                    B: "bg-blue-500/15 text-blue-600 border-blue-500/25",
                    C: "bg-amber-500/15 text-amber-600 border-amber-500/25",
                    D: "bg-slate-500/15 text-slate-500 border-slate-500/25",
                  }
                  return (
                    <div
                      key={grade}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${colors[grade]}`}
                    >
                      <Shield className="size-3" />
                      <span className="text-xs font-semibold">
                        {count} Grade {grade}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {[
                    { grade: "A", label: "High quality", color: "text-emerald-600 dark:text-emerald-400" },
                    { grade: "B", label: "Moderate quality", color: "text-blue-600 dark:text-blue-400" },
                    { grade: "C", label: "Low quality", color: "text-amber-600 dark:text-amber-400" },
                    { grade: "D", label: "Very low quality", color: "text-slate-500" },
                  ].map(({ grade, label, color }) => (
                    <span key={grade} className="text-[11px] text-muted-foreground">
                      <span className={`font-semibold ${color}`}>Grade {grade}</span>
                      {" — "}{label}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground/70">
                  Scored on study design (40%), recency (20%), journal (15%), sample size (15%), reporting quality (10%).{" "}
                  <a href="/how-it-works#evidence" className="underline hover:text-muted-foreground">Learn more</a>
                </p>
              </div>
            </div>
          )}

          {/* MeSH mappings */}
          {data.meshMappings && Object.keys(data.meshMappings).length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                MeSH Term Mappings
              </h4>
              <div className="flex flex-col gap-1.5">
                {Object.entries(data.meshMappings).map(([descriptor, synonyms]) => (
                  <div
                    key={descriptor}
                    className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-primary">
                      {descriptor}
                    </p>
                    {synonyms.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Synonyms: {synonyms.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-queries */}
          {data.subQueries.length > 1 && (
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sub-queries Generated
              </h4>
              <div className="flex flex-col gap-1.5">
                {data.subQueries.map((sq, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <p className="flex-1 truncate text-xs text-foreground font-mono">
                      {sq}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
