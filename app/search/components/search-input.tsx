"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SearchSettingsPanel } from "./search-settings"
import { Search, Settings, Loader2 } from "lucide-react"
import type { SearchSettings } from "@/lib/types"

interface SearchInputProps {
  settings: SearchSettings
  onSettingsChange: (settings: SearchSettings) => void
  onSearch: (query: string) => void
  isLoading: boolean
}

export function SearchInput({
  settings,
  onSettingsChange,
  onSearch,
  isLoading,
}: SearchInputProps) {
  const [query, setQuery] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && settings.apiKey.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a biomedical research question..."
            className="h-12 pl-10 text-base"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          className="h-12 bg-teal px-6 text-foreground hover:bg-teal-hover"
          disabled={isLoading || !query.trim() || !settings.apiKey.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </form>

      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Settings className="h-4 w-4" />
            {settingsOpen ? "Hide settings" : "Show settings"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 rounded-lg border border-border/40 bg-card p-4">
          <SearchSettingsPanel
            settings={settings}
            onChange={onSettingsChange}
          />
        </CollapsibleContent>
      </Collapsible>

      {!settings.apiKey.trim() && (
        <p className="text-sm text-destructive">
          Please add your Google Gemini API key in settings before searching.
        </p>
      )}
    </div>
  )
}
