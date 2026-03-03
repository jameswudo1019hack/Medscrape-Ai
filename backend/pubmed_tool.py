"""
PubMed Tool — Search and fetch abstracts from NCBI PubMed.
Uses the Entrez E-utilities API (free, no key required for <3 req/s).
"""

import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

# Module-level cache for MeSH lookups within a session
_mesh_cache: Dict[str, Optional[Dict[str, Any]]] = {}

PUBLICATION_TYPE_RANK: Dict[str, int] = {
    "Meta-Analysis": 9,
    "Systematic Review": 8,
    "Randomized Controlled Trial": 7,
    "Clinical Trial": 6,
    "Controlled Clinical Trial": 6,
    "Review": 5,
    "Comparative Study": 4,
    "Observational Study": 4,
    "Multicenter Study": 3,
    "Case Reports": 2,
    "Journal Article": 1,
}


def _best_publication_type(pub_types: List[str]) -> str:
    """Pick the highest-ranked publication type from a list."""
    if not pub_types:
        return "Journal Article"
    best = max(pub_types, key=lambda t: PUBLICATION_TYPE_RANK.get(t, 0))
    return best if PUBLICATION_TYPE_RANK.get(best, 0) > 0 else pub_types[0]


def lookup_mesh_terms(query: str) -> Dict[str, Dict[str, Any]]:
    """Look up MeSH descriptors for a query using NCBI E-utilities.

    Searches the MeSH database to find official descriptors and entry terms
    (synonyms) for the query. Uses esearch (db=mesh) to find UIDs, then
    efetch to get descriptor details including entry terms.

    Returns:
        Dict mapping descriptor name → {mesh_id, entry_terms: list[str]}
        Empty dict if no MeSH match found.
    """
    # Check cache first
    cache_key = query.lower().strip()
    if cache_key in _mesh_cache:
        return _mesh_cache[cache_key] or {}

    try:
        # Step 1: Search MeSH database for the query
        params = urllib.parse.urlencode({
            "db": "mesh",
            "term": query,
            "retmax": 3,
            "retmode": "json",
        })
        url = f"{ESEARCH_URL}?{params}"
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read())

        ids = data.get("esearchresult", {}).get("idlist", [])
        if not ids:
            _mesh_cache[cache_key] = None
            return {}

        # Step 2: Fetch MeSH descriptor details (entry terms)
        params = urllib.parse.urlencode({
            "db": "mesh",
            "id": ",".join(ids[:3]),
            "retmode": "xml",
        })
        url = f"{EFETCH_URL}?{params}"
        with urllib.request.urlopen(url, timeout=5) as resp:
            xml_data = resp.read()

        root = ET.fromstring(xml_data)
        results = {}

        for record in root.findall(".//DescriptorRecord"):
            name_elem = record.find(".//DescriptorName/String")
            if name_elem is None or not name_elem.text:
                continue
            descriptor = name_elem.text
            uid = record.find(".//DescriptorUI")
            mesh_id = uid.text if uid is not None else ""

            # Collect all entry terms (synonyms) from concepts
            entry_terms = []
            for term in record.findall(".//Term/String"):
                if term.text and term.text != descriptor:
                    entry_terms.append(term.text)

            results[descriptor] = {
                "mesh_id": mesh_id,
                "entry_terms": entry_terms[:8],
            }

        _mesh_cache[cache_key] = results if results else None
        return results

    except Exception as e:
        print(f"MeSH lookup error: {e}")
        _mesh_cache[cache_key] = None
        return {}


def build_mesh_queries(query: str, mesh_data: Dict[str, Dict]) -> List[str]:
    """Build MeSH-enhanced PubMed queries from lookup results.

    Returns a list of query variants:
      1. The original query with MeSH-tagged descriptors
      2. 1-2 entry-term based variants for broader recall

    If no MeSH data, returns an empty list (caller falls back to plain text).
    """
    if not mesh_data:
        return []

    variants = []

    # Pick the best (first) descriptor
    descriptor = next(iter(mesh_data))
    info = mesh_data[descriptor]

    # Variant 1: explicit MeSH-tagged query
    mesh_query = f'"{descriptor}"[MeSH Terms]'
    # Append any remaining words from original query not in the descriptor
    remaining = query.lower()
    for word in descriptor.lower().split():
        remaining = remaining.replace(word, "").strip()
    remaining = " ".join(remaining.split())
    if remaining and len(remaining) > 2:
        mesh_query += f" {remaining}"
    variants.append(mesh_query)

    # Variant 2-3: entry term variants (use top synonyms)
    for term in info.get("entry_terms", [])[:2]:
        variants.append(term)

    return variants


def search_pubmed(
    query: str,
    max_results: int = 8,
    sort: str = "relevance",
    date_range: str = "all",
) -> List[str]:
    """
    Search PubMed and return a list of PMIDs.

    Args:
        query: Search query string (supports PubMed syntax)
        max_results: Maximum number of results to return
        sort: Sort order — 'relevance' or 'date'
        date_range: Date filter — 'all', '1' (last year), or '5' (last 5 years)

    Returns:
        List of PMID strings
    """
    params_dict = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "sort": sort,
        "retmode": "xml",
    }

    if date_range in ("1", "5"):
        years = int(date_range)
        min_date = (datetime.now() - timedelta(days=365 * years)).strftime("%Y/%m/%d")
        max_date = datetime.now().strftime("%Y/%m/%d")
        params_dict["mindate"] = min_date
        params_dict["maxdate"] = max_date
        params_dict["datetype"] = "pdat"

    params = urllib.parse.urlencode(params_dict)
    
    url = f"{ESEARCH_URL}?{params}"
    
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        pmids = [id_elem.text for id_elem in root.findall(".//Id")]
        return pmids
    
    except Exception as e:
        print(f"PubMed search error: {e}")
        return []


def fetch_abstracts(pmids: List[str]) -> List[Dict]:
    """
    Fetch full abstract data for a list of PMIDs.
    
    Args:
        pmids: List of PubMed IDs
    
    Returns:
        List of dicts with keys: pmid, title, abstract, authors, journal, year
    """
    if not pmids:
        return []
    
    params = urllib.parse.urlencode({
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
        "rettype": "abstract",
    })
    
    url = f"{EFETCH_URL}?{params}"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        papers = []
        
        for article in root.findall(".//PubmedArticle"):
            paper = _parse_article(article)
            if paper:
                papers.append(paper)
        
        return papers
    
    except Exception as e:
        print(f"PubMed fetch error: {e}")
        return []


def _parse_article(article_elem) -> Dict:
    """Parse a single PubmedArticle XML element into a dict."""
    
    try:
        # PMID
        pmid = article_elem.findtext(".//PMID", default="")
        
        # Title
        title = article_elem.findtext(".//ArticleTitle", default="No title")
        
        # Abstract
        abstract_parts = []
        for abs_text in article_elem.findall(".//AbstractText"):
            label = abs_text.get("Label", "")
            text = abs_text.text or ""
            if label:
                abstract_parts.append(f"{label}: {text}")
            else:
                abstract_parts.append(text)
        abstract = "\n\n".join(abstract_parts) if abstract_parts else "No abstract available."
        
        # Authors
        authors = []
        for author in article_elem.findall(".//Author"):
            last = author.findtext("LastName", default="")
            first = author.findtext("ForeName", default="")
            if last:
                authors.append(f"{last} {first}".strip())
        author_str = ", ".join(authors[:3])
        if len(authors) > 3:
            author_str += " et al."
        
        # Journal
        journal = article_elem.findtext(".//Journal/Title", default="")
        
        # Year
        year = article_elem.findtext(".//PubDate/Year", default="")
        if not year:
            medline_date = article_elem.findtext(".//PubDate/MedlineDate", default="")
            year = medline_date[:4] if medline_date else ""

        # Publication types
        pub_types = [
            pt.text for pt in article_elem.findall(".//PublicationType")
            if pt.text
        ]
        publication_type = _best_publication_type(pub_types)

        # DOI
        doi = ""
        for article_id in article_elem.findall(".//ArticleId"):
            if article_id.get("IdType") == "doi" and article_id.text:
                doi = article_id.text
                break

        return {
            "pmid": pmid,
            "title": title,
            "abstract": abstract,
            "abstract_snippet": abstract[:300],
            "authors": author_str,
            "journal": journal,
            "year": year,
            "publication_type": publication_type,
            "doi": doi,
        }
    
    except Exception:
        return None


def format_paper_for_context(paper: Dict) -> str:
    """Format a paper dict into a text chunk for embedding."""
    return (
        f"Title: {paper['title']}\n"
        f"Authors: {paper['authors']}\n"
        f"Journal: {paper['journal']} ({paper['year']})\n"
        f"Study Type: {paper.get('publication_type', 'Journal Article')}\n"
        f"PMID: {paper['pmid']}\n"
        f"Abstract: {paper['abstract']}"
    )


def sort_papers_by_quality(papers: List[Dict]) -> List[Dict]:
    """Sort papers by evidence quality (highest first). Stable sort preserves relevance order within same tier."""
    return sorted(
        papers,
        key=lambda p: PUBLICATION_TYPE_RANK.get(p.get("publication_type", "Journal Article"), 0),
        reverse=True,
    )
