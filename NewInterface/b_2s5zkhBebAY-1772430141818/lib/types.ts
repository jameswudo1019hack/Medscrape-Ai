export interface Paper {
  id: string
  pmid: string
  title: string
  authors: string[]
  journal: string
  year: number
  doi: string
  abstract: string
  publicationType: "meta-analysis" | "systematic-review" | "rct" | "clinical-trial" | "review" | "cohort-study" | "case-report" | "editorial"
  citationCount?: number
}

export interface SearchQuery {
  id: string
  query: string
  timestamp: Date
  resultCount?: number
}

export interface SubQuery {
  id: string
  query: string
  status: "completed" | "running" | "pending"
  resultCount: number
  duration?: number
}

export interface PipelineStats {
  totalPapersScanned: number
  relevantPapersFound: number
  aiProcessingTime: number
  subQueries: SubQuery[]
}
