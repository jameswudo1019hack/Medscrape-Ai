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
    </div>
  )
}
