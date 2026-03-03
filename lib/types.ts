export interface SearchSettings {
  apiKey: string
  maxPapers: number
  sort: "relevance" | "date"
  dateRange: "all" | "1" | "5"
  studyTypeFilter: "all" | "reviews" | "trials"
  referenceStyle: "apa" | "vancouver" | "harvard" | "chicago" | "ama"
  researchDepth: "standard" | "deep"
}

export interface EvidenceGrade {
  grade: "A" | "B" | "C" | "D"
  score: number
}

export interface Source {
  pmid: string
  title: string
  abstract: string
  abstract_snippet: string
  authors: string
  journal: string
  year: string
  publication_type: string
  doi?: string
  evidence_grade?: EvidenceGrade
  has_full_text?: boolean
}

export interface SearchResult {
  answer: string
  sources: Source[]
  papers_found: number
  papers_retrieved: number
}

export interface TransparencyData {
  subQueries: string[]
  totalPapersFound: number
  papersWithAbstracts: number
  papersAfterFiltering: number
  meshMappings?: Record<string, string[]>
  evidenceGrades?: Record<string, number>
}

export interface HistoryEntry {
  id: string
  query: string
  timestamp: number
  answerSnippet: string
  paperCount: number
  result: SearchResult
}
