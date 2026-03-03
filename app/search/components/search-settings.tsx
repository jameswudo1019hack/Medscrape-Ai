"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SearchSettings } from "@/lib/types"

interface SearchSettingsProps {
  settings: SearchSettings
  onChange: (settings: SearchSettings) => void
}

export function SearchSettingsPanel({ settings, onChange }: SearchSettingsProps) {
  return (
    <div className="space-y-4">
      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="api-key">Google Gemini API Key</Label>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter your API key..."
          value={settings.apiKey}
          onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">
          Get a free key at{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal underline"
          >
            Google AI Studio
          </a>
        </p>
      </div>

      {/* Max Papers */}
      <div className="space-y-2">
        <Label>Max papers: {settings.maxPapers}</Label>
        <Slider
          value={[settings.maxPapers]}
          onValueChange={(value) =>
            onChange({ ...settings, maxPapers: value[0] })
          }
          min={3}
          max={20}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3</span>
          <span>20</span>
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>Date range</Label>
        <Select
          value={settings.dateRange}
          onValueChange={(value: "all" | "1" | "5") =>
            onChange({ ...settings, dateRange: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time (default)</SelectItem>
            <SelectItem value="1">Last year</SelectItem>
            <SelectItem value="5">Last 5 years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search Strategy */}
      <div className="space-y-2">
        <Label>Search strategy</Label>
        <Select
          value={settings.sort}
          onValueChange={(value: "relevance" | "date") =>
            onChange({ ...settings, sort: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance (default)</SelectItem>
            <SelectItem value="date">Recent first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Study Type Filter */}
      <div className="space-y-2">
        <Label>Preferred study type</Label>
        <Select
          value={settings.studyTypeFilter}
          onValueChange={(value: "all" | "reviews" | "trials") =>
            onChange({ ...settings, studyTypeFilter: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types (default)</SelectItem>
            <SelectItem value="reviews">Reviews & Meta-analyses</SelectItem>
            <SelectItem value="trials">Clinical Trials</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Research Depth */}
      <div className="space-y-2">
        <Label>Research depth</Label>
        <Select
          value={settings.researchDepth}
          onValueChange={(value: "standard" | "deep") =>
            onChange({ ...settings, researchDepth: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (default)</SelectItem>
            <SelectItem value="deep">Deep Research (multi-step agent)</SelectItem>
          </SelectContent>
        </Select>
        {settings.researchDepth === "deep" && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 space-y-2">
            <p className="text-xs font-medium text-primary">How it works</p>
            <div className="space-y-1">
              {[
                "Plan — breaks your question into search aspects",
                "Search — parallel PubMed + MeSH expansion",
                "Evaluate — checks which aspects are still uncovered",
                "Refine — issues targeted follow-up queries",
                "Synthesize — comprehensive answer from all evidence",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-mono text-[9px] text-primary">
                    {i + 1}
                  </span>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70">
              Runs up to 2 refinement cycles. Takes ~2× longer but finds significantly more evidence.
            </p>
          </div>
        )}
      </div>

      {/* Reference Style */}
      <div className="space-y-2">
        <Label>Reference style</Label>
        <Select
          value={settings.referenceStyle}
          onValueChange={(value: SearchSettings["referenceStyle"]) =>
            onChange({ ...settings, referenceStyle: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vancouver">Vancouver (default)</SelectItem>
            <SelectItem value="apa">APA 7th</SelectItem>
            <SelectItem value="harvard">Harvard</SelectItem>
            <SelectItem value="ama">AMA</SelectItem>
            <SelectItem value="chicago">Chicago</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
