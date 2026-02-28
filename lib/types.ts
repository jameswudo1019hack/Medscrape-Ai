export interface SearchSettings {
  apiKey: string
  maxPapers: number
  sort: "relevance" | "date"
  dateRange: "all" | "1" | "5"
}

export interface Source {
  pmid: string
  title: string
  abstract: string
  abstract_snippet: string
  authors: string
  journal: string
  year: string
}

export interface SearchResult {
  answer: string
  sources: Source[]
  papers_found: number
  papers_retrieved: number
}
