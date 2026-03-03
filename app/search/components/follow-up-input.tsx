"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare } from "lucide-react"

interface FollowUpInputProps {
  onSubmit: (query: string) => void
  isLoading: boolean
}

export function FollowUpInput({ onSubmit, isLoading }: FollowUpInputProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = () => {
    if (!query.trim() || isLoading) return
    onSubmit(query.trim())
    setQuery("")
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-card p-2">
      <MessageSquare className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Ask a follow-up question..."
        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        disabled={isLoading}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!query.trim() || isLoading}
        className="shrink-0 bg-teal text-white hover:bg-teal-hover"
      >
        Ask
      </Button>
    </div>
  )
}
