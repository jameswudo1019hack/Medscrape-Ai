import type { Source } from "./types"

export type ReferenceStyle = "apa" | "vancouver" | "harvard" | "chicago" | "ama"

export const REFERENCE_STYLES: { value: ReferenceStyle; label: string }[] = [
  { value: "vancouver", label: "Vancouver" },
  { value: "apa", label: "APA 7th" },
  { value: "harvard", label: "Harvard" },
  { value: "ama", label: "AMA" },
  { value: "chicago", label: "Chicago" },
]

/** Format a single source's authors for a given style. */
function _authors(s: Source, style: ReferenceStyle): string {
  // Raw author string from PubMed: "Smith J, Doe A, Jones B et al."
  const raw = s.authors.replace(/ et al\.?$/, "").trim()
  const names = raw.split(", ").map((n) => n.trim()).filter(Boolean)
  const hasEtAl = s.authors.includes("et al")

  switch (style) {
    case "apa": {
      // APA: Smith, J., Doe, A., & Jones, B.
      const formatted = names.map((n) => {
        const parts = n.split(" ")
        if (parts.length >= 2) {
          const last = parts[0]
          const initials = parts.slice(1).map((p) => p.charAt(0) + ".").join(" ")
          return `${last}, ${initials}`
        }
        return n
      })
      if (hasEtAl) return formatted.join(", ") + ", et al."
      if (formatted.length === 1) return formatted[0]
      return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1]
    }
    case "vancouver":
    case "ama": {
      // Vancouver/AMA: Smith J, Doe A, Jones B.
      const formatted = names.map((n) => {
        const parts = n.split(" ")
        if (parts.length >= 2) return `${parts[0]} ${parts.slice(1).map((p) => p.charAt(0)).join("")}`
        return n
      })
      if (hasEtAl) return formatted.join(", ") + ", et al."
      return formatted.join(", ")
    }
    case "harvard": {
      // Harvard: Smith, J, Doe, A & Jones, B
      const formatted = names.map((n) => {
        const parts = n.split(" ")
        if (parts.length >= 2) return `${parts[0]}, ${parts.slice(1).map((p) => p.charAt(0)).join("")}`
        return n
      })
      if (hasEtAl) return formatted.join(", ") + " et al."
      if (formatted.length === 1) return formatted[0]
      return formatted.slice(0, -1).join(", ") + " & " + formatted[formatted.length - 1]
    }
    case "chicago": {
      // Chicago: Smith, John, Anna Doe, and Bob Jones.
      // We only have initials, so: Smith, J., A. Doe, and B. Jones
      const formatted = names.map((n, i) => {
        const parts = n.split(" ")
        if (parts.length < 2) return n
        const last = parts[0]
        const initials = parts.slice(1).map((p) => p.charAt(0) + ".").join(" ")
        if (i === 0) return `${last}, ${initials}`
        return `${initials} ${last}`
      })
      if (hasEtAl) return formatted.join(", ") + ", et al."
      if (formatted.length === 1) return formatted[0]
      return formatted.slice(0, -1).join(", ") + ", and " + formatted[formatted.length - 1]
    }
    default:
      return s.authors
  }
}

function _doi(s: Source): string {
  if (!s.doi) return ""
  return s.doi.startsWith("http") ? s.doi : `https://doi.org/${s.doi}`
}

/** Format a single source in the given referencing style. */
function _formatSource(s: Source, style: ReferenceStyle, index: number): string {
  const authors = _authors(s, style)
  const doi = _doi(s)
  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}`

  switch (style) {
    case "apa":
      // Author, A. A. (Year). Title of article. Journal Name. https://doi.org/xxx
      return `${authors} (${s.year || "n.d."}). ${s.title}. ${s.journal}.${doi ? ` ${doi}` : ` ${pubmedUrl}`}`

    case "vancouver":
      // 1. Author AA. Title of article. Journal Name. Year. doi: xxx.
      return `${index}. ${authors}. ${s.title}. ${s.journal}. ${s.year || "n.d."}.${doi ? ` doi: ${s.doi}.` : ""} PMID: ${s.pmid}.`

    case "harvard":
      // Author, A Year, 'Title of article', Journal Name. Available at: URL
      return `${authors} ${s.year || "n.d."}, '${s.title}', ${s.journal}. Available at: ${doi || pubmedUrl}.`

    case "ama":
      // Author AA. Title of article. Journal Name. Year. doi:xxx
      return `${index}. ${authors}. ${s.title}. ${s.journal}. ${s.year || "n.d."}.${doi ? ` doi:${s.doi}` : ""}`

    case "chicago":
      // Author, A. Year. "Title of Article." Journal Name. URL.
      return `${authors}. ${s.year || "n.d."}. "${s.title}." ${s.journal}.${doi ? ` ${doi}.` : ` ${pubmedUrl}.`}`

    default:
      return `${authors}. ${s.title}. ${s.journal}. ${s.year}.`
  }
}

/** Format all sources as a reference list in the given style. */
export function formatReferences(sources: Source[], style: ReferenceStyle): string {
  // For author-date styles (APA, Harvard, Chicago), sort alphabetically
  // For numbered styles (Vancouver, AMA), keep citation order
  const sorted = ["apa", "harvard", "chicago"].includes(style)
    ? [...sources].sort((a, b) => a.authors.localeCompare(b.authors))
    : sources

  return sorted
    .map((s, i) => _formatSource(s, style, i + 1))
    .join("\n\n")
}

export function sourcesToBibtex(sources: Source[]): string {
  return sources
    .map((s) => {
      const key = `pmid${s.pmid}`
      const authors = s.authors.replace(/ et al\.?$/, " and others")
      return [
        `@article{${key},`,
        `  title = {${s.title}},`,
        `  author = {${authors}},`,
        `  journal = {${s.journal}},`,
        `  year = {${s.year}},`,
        `  pmid = {${s.pmid}},`,
        ...(s.doi ? [`  doi = {${s.doi}},`] : []),
        `  url = {https://pubmed.ncbi.nlm.nih.gov/${s.pmid}}`,
        `}`,
      ].join("\n")
    })
    .join("\n\n")
}

export function sourcesToRis(sources: Source[]): string {
  return sources
    .map((s) => {
      const authorLines = s.authors
        .replace(/ et al\.?$/, "")
        .split(", ")
        .map((a) => `AU  - ${a.trim()}`)
        .join("\n")
      return [
        `TY  - JOUR`,
        authorLines,
        `TI  - ${s.title}`,
        `JO  - ${s.journal}`,
        `PY  - ${s.year}`,
        `AN  - ${s.pmid}`,
        ...(s.doi ? [`DO  - ${s.doi}`] : []),
        `UR  - https://pubmed.ncbi.nlm.nih.gov/${s.pmid}`,
        `ER  - `,
      ].join("\n")
    })
    .join("\n\n")
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
