"""
PubMed Tool — Search and fetch abstracts from NCBI PubMed.
Uses the Entrez E-utilities API (free, no key required for <3 req/s).
"""

import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import time
from datetime import datetime, timedelta
from typing import List, Dict


ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

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
        abstract = " ".join(abstract_parts) if abstract_parts else "No abstract available."
        
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

        return {
            "pmid": pmid,
            "title": title,
            "abstract": abstract,
            "abstract_snippet": abstract[:300],
            "authors": author_str,
            "journal": journal,
            "year": year,
            "publication_type": publication_type,
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
