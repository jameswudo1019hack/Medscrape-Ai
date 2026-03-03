import type { HistoryEntry, SearchResult } from "./types"

const STORAGE_KEY = "medscrape-search-history"
const MAX_ENTRIES = 50

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToHistory(query: string, result: SearchResult): void {
  if (typeof window === "undefined") return
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    query,
    timestamp: Date.now(),
    answerSnippet: result.answer.slice(0, 200),
    paperCount: result.sources.length,
    result,
  }
  const history = getHistory()
  history.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)))
}

export function clearHistory(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

export function removeEntry(id: string): void {
  if (typeof window === "undefined") return
  const history = getHistory().filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}
