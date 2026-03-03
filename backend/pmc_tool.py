"""
PMC Tool — Fetch full-text articles from PubMed Central.

Uses the NCBI ID Converter API to map PMIDs → PMC IDs, then fetches
full-text XML via efetch (db=pmc). Parses the XML into structured
sections (Introduction, Methods, Results, Discussion).
"""

import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional


_ID_CONVERTER_URL = "https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/"
_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

# Section title patterns mapped to canonical names
_SECTION_MAP = {
    "introduction": "introduction",
    "background": "introduction",
    "intro": "introduction",
    "methods": "methods",
    "materials and methods": "methods",
    "methodology": "methods",
    "study design": "methods",
    "experimental procedures": "methods",
    "patients and methods": "methods",
    "results": "results",
    "findings": "results",
    "outcomes": "results",
    "discussion": "discussion",
    "comment": "discussion",
    "interpretation": "discussion",
    "conclusion": "discussion",
    "conclusions": "discussion",
    "summary": "discussion",
}


def find_pmc_ids(pmids: List[str]) -> Dict[str, str]:
    """Map PMIDs → PMC IDs using the NCBI ID Converter API.

    Args:
        pmids: List of PubMed IDs

    Returns:
        Dict mapping PMID → PMC ID (e.g., "12345" → "PMC6789012")
        Only includes PMIDs that have a corresponding PMC article.
    """
    if not pmids:
        return {}

    # The converter accepts up to 200 IDs per request
    results = {}
    batch_size = 200

    for i in range(0, len(pmids), batch_size):
        batch = pmids[i:i + batch_size]
        try:
            params = urllib.parse.urlencode({
                "ids": ",".join(batch),
                "format": "json",
                "tool": "medscrape",
                "email": "medscrape@example.com",
            })
            url = f"{_ID_CONVERTER_URL}?{params}"
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read())

            for record in data.get("records", []):
                pmid = record.get("pmid", "")
                pmcid = record.get("pmcid", "")
                if pmid and pmcid:
                    results[pmid] = pmcid

        except Exception as e:
            print(f"PMC ID converter error: {e}")
            continue

    return results


def _extract_text(elem) -> str:
    """Recursively extract all text from an XML element, ignoring tags."""
    parts = []
    if elem.text:
        parts.append(elem.text)
    for child in elem:
        parts.append(_extract_text(child))
        if child.tail:
            parts.append(child.tail)
    return "".join(parts)


def _classify_section(title: str) -> Optional[str]:
    """Map a section title to a canonical section name."""
    normalized = title.strip().lower()
    # Direct match
    if normalized in _SECTION_MAP:
        return _SECTION_MAP[normalized]
    # Partial match
    for key, canonical in _SECTION_MAP.items():
        if key in normalized:
            return canonical
    return None


def fetch_pmc_fulltext(pmc_id: str) -> Optional[Dict[str, str]]:
    """Fetch full-text XML from PMC and parse into sections.

    Args:
        pmc_id: PMC ID (e.g., "PMC6789012")

    Returns:
        Dict with keys: introduction, methods, results, discussion, full_text
        Or None if the article is not accessible.
    """
    try:
        params = urllib.parse.urlencode({
            "db": "pmc",
            "id": pmc_id,
            "retmode": "xml",
        })
        url = f"{_EFETCH_URL}?{params}"
        with urllib.request.urlopen(url, timeout=15) as resp:
            xml_data = resp.read()

        root = ET.fromstring(xml_data)

        # Find the article body
        body = root.find(".//body")
        if body is None:
            return None

        sections: Dict[str, List[str]] = {
            "introduction": [],
            "methods": [],
            "results": [],
            "discussion": [],
        }
        all_text_parts = []

        for sec in body.findall(".//sec"):
            # Get section title
            title_elem = sec.find("title")
            title = _extract_text(title_elem).strip() if title_elem is not None else ""
            canonical = _classify_section(title) if title else None

            # Extract all paragraphs in this section
            paragraphs = []
            for p in sec.findall(".//p"):
                text = _extract_text(p).strip()
                if text:
                    paragraphs.append(text)

            sec_text = "\n\n".join(paragraphs)
            if not sec_text:
                continue

            if title:
                sec_text = f"{title}\n\n{sec_text}"

            all_text_parts.append(sec_text)

            if canonical and canonical in sections:
                sections[canonical].append(sec_text)

        if not all_text_parts:
            return None

        result = {
            "full_text": "\n\n---\n\n".join(all_text_parts),
        }
        for key, parts in sections.items():
            result[key] = "\n\n".join(parts) if parts else ""

        return result

    except Exception as e:
        print(f"PMC fetch error for {pmc_id}: {e}")
        return None


def enrich_papers_with_fulltext(
    papers: List[dict],
    max_fulltext: int = 5,
) -> List[dict]:
    """Enrich top-ranked papers with full text from PMC.

    For efficiency, only attempts full-text retrieval for the first
    `max_fulltext` papers. Uses parallel fetching.

    Args:
        papers: List of paper dicts (already ranked)
        max_fulltext: Maximum number of papers to fetch full text for

    Returns:
        The same list with 'full_text_sections' and 'has_full_text' added
        to papers that have PMC full text available.
    """
    # Collect PMIDs for top papers
    target_pmids = [p["pmid"] for p in papers[:max_fulltext]]
    if not target_pmids:
        return papers

    # Step 1: Find which papers are in PMC
    pmid_to_pmc = find_pmc_ids(target_pmids)
    if not pmid_to_pmc:
        return papers

    # Step 2: Fetch full text in parallel
    pmc_results: Dict[str, Dict] = {}

    def _fetch(pmid: str, pmc_id: str):
        result = fetch_pmc_fulltext(pmc_id)
        return pmid, result

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [
            pool.submit(_fetch, pmid, pmc_id)
            for pmid, pmc_id in pmid_to_pmc.items()
        ]
        for future in as_completed(futures):
            try:
                pmid, result = future.result()
                if result:
                    pmc_results[pmid] = result
            except Exception:
                pass

    # Step 3: Attach to papers
    for paper in papers:
        pmid = paper["pmid"]
        if pmid in pmc_results:
            paper["full_text_sections"] = pmc_results[pmid]
            paper["has_full_text"] = True
        else:
            paper["has_full_text"] = False

    return papers
