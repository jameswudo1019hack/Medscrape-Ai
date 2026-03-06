"use client"

import { useEffect, useState, useRef } from "react"
import {
  Brain,
  FileDown,
  FileText,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AIAnswerCardProps {
  answer: string
  isStreaming?: boolean
}

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: React.ReactNode[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 ml-4 flex flex-col gap-1">
          {listItems}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  const renderInline = (line: string) => {
    const parts: React.ReactNode[] = []
    let remaining = line
    let key = 0

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>)
        }
        parts.push(
          <strong key={key++} className="font-semibold text-foreground">
            {boldMatch[1]}
          </strong>
        )
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
        continue
      }

      // Reference [1]
      const refMatch = remaining.match(/\[(\d+)\]/)
      if (refMatch && refMatch.index !== undefined) {
        if (refMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, refMatch.index)}</span>)
        }
        parts.push(
          <sup
            key={key++}
            className="ml-0.5 inline-flex size-4 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary"
          >
            {refMatch[1]}
          </sup>
        )
        remaining = remaining.slice(refMatch.index + refMatch[0].length)
        continue
      }

      parts.push(<span key={key++}>{remaining}</span>)
      break
    }
    return parts
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Horizontal rule
    if (line.trim() === "---") {
      flushList()
      elements.push(<hr key={`hr-${i}`} className="my-4 border-border/50" />)
      continue
    }

    // H2
    if (line.startsWith("## ")) {
      flushList()
      elements.push(
        <h2 key={`h2-${i}`} className="mb-2 mt-4 text-lg font-semibold text-foreground first:mt-0">
          {line.slice(3)}
        </h2>
      )
      continue
    }

    // H3
    if (line.startsWith("### ")) {
      flushList()
      elements.push(
        <h3 key={`h3-${i}`} className="mb-1.5 mt-3 text-sm font-semibold text-foreground">
          {line.slice(4)}
        </h3>
      )
      continue
    }

    // List item
    if (line.startsWith("- ")) {
      inList = true
      listItems.push(
        <li key={`li-${i}`} className="text-sm leading-relaxed text-muted-foreground">
          <span className="mr-1.5 text-primary/60">{"•"}</span>
          {renderInline(line.slice(2))}
        </li>
      )
      continue
    }

    // Empty line
    if (line.trim() === "") {
      flushList()
      continue
    }

    // Italic / em
    if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      flushList()
      elements.push(
        <p key={`em-${i}`} className="text-xs italic leading-relaxed text-muted-foreground/70">
          {line.slice(1, -1)}
        </p>
      )
      continue
    }

    // Paragraph
    flushList()
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-muted-foreground">
        {renderInline(line)}
      </p>
    )
  }

  flushList()
  return elements
}

export function AIAnswerCard({ answer, isStreaming = false }: AIAnswerCardProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const streamRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(answer)
      return
    }

    let currentIndex = 0
    setDisplayedText("")

    const stream = () => {
      if (currentIndex < answer.length) {
        const chunkSize = Math.floor(Math.random() * 4) + 2
        currentIndex = Math.min(currentIndex + chunkSize, answer.length)
        setDisplayedText(answer.slice(0, currentIndex))
        streamRef.current = setTimeout(stream, 8 + Math.random() * 12)
      }
    }

    stream()

    return () => {
      if (streamRef.current) clearTimeout(streamRef.current)
    }
  }, [answer, isStreaming])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isComplete = displayedText.length === answer.length

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1.5">
            <Brain className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              AI-Generated Answer
            </h2>
            {!isComplete && (
              <p className="text-xs text-primary">Analyzing sources...</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isComplete && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Copy answer"
              >
                {copied ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Export as PDF"
              >
                <FileDown className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Export BibTeX"
              >
                <FileText className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Export RIS"
              >
                <BookOpen className="size-3.5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-4 sm:px-5">
          <div className="prose-sm">
            {renderMarkdown(displayedText)}
            {!isComplete && (
              <span className="inline-block h-4 w-0.5 animate-pulse bg-primary" />
            )}
          </div>

          {/* Export buttons row */}
          {isComplete && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
              <span className="text-xs text-muted-foreground">Export:</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
              >
                <FileDown className="size-3" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
              >
                <FileText className="size-3" />
                BibTeX
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
              >
                <BookOpen className="size-3" />
                RIS
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
