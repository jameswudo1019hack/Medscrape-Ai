"""
Evidence Grading — Oxford CEBM-inspired quality scoring for PubMed papers.

Assigns each paper an A/B/C/D evidence grade based on:
  - Study design (40%) — meta-analyses and systematic reviews score highest
  - Recency (20%) — recent papers score higher
  - Journal/DOI quality proxy (15%) — presence of DOI, known high-impact journals
  - Sample size signals (15%) — extracted from abstract text
  - Reporting quality (10%) — mentions of PRISMA, CONSORT, STROBE, etc.
"""

import re
from datetime import datetime
from typing import Dict, List, Optional

# Study design scores (0-100), aligned with PUBLICATION_TYPE_RANK
_DESIGN_SCORES: Dict[str, int] = {
    "Meta-Analysis": 100,
    "Systematic Review": 95,
    "Randomized Controlled Trial": 85,
    "Clinical Trial": 70,
    "Controlled Clinical Trial": 70,
    "Comparative Study": 55,
    "Observational Study": 50,
    "Multicenter Study": 60,
    "Review": 40,
    "Case Reports": 20,
    "Journal Article": 30,
}

# Reporting guideline keywords that signal methodological rigor
_REPORTING_KEYWORDS = [
    "PRISMA", "CONSORT", "STROBE", "MOOSE", "QUORUM",
    "STARD", "SPIRIT", "CARE", "ARRIVE", "EQUATOR",
    "pre-registered", "preregistered", "registered protocol",
    "prospectively registered", "trial registration",
    "ClinicalTrials.gov", "PROSPERO", "ISRCTN",
]

# Regex patterns for extracting sample sizes from abstracts
_SAMPLE_SIZE_PATTERNS = [
    r'[Nn]\s*=\s*(\d[\d,]*)',                           # n=1234 or N = 1,234
    r'(\d[\d,]*)\s+(?:patients|participants|subjects|individuals|cases|children|adults)',
    r'(?:sample|cohort|population)\s+(?:of|size[: ]*)\s*(\d[\d,]*)',
    r'(?:enrolled|recruited|included|analyzed|randomized)\s+(\d[\d,]*)',
    r'(\d[\d,]*)\s+(?:were\s+)?(?:enrolled|recruited|included|analyzed|randomized)',
    r'total\s+of\s+(\d[\d,]*)',
]


def _extract_sample_size(abstract: str) -> Optional[int]:
    """Extract the largest mentioned sample size from the abstract."""
    if not abstract:
        return None
    sizes = []
    for pattern in _SAMPLE_SIZE_PATTERNS:
        for match in re.finditer(pattern, abstract, re.IGNORECASE):
            try:
                n = int(match.group(1).replace(",", ""))
                if 5 <= n <= 50_000_000:  # filter out implausible numbers
                    sizes.append(n)
            except (ValueError, IndexError):
                continue
    return max(sizes) if sizes else None


def _score_design(pub_type: str) -> float:
    """Score 0-100 based on study design."""
    return _DESIGN_SCORES.get(pub_type, 30)


def _score_recency(year_str: str) -> float:
    """Score 0-100 based on publication year. Recent papers score higher."""
    try:
        year = int(year_str)
    except (ValueError, TypeError):
        return 30  # unknown year → middle score

    current_year = datetime.now().year
    age = current_year - year

    if age <= 2:
        return 100
    elif age <= 5:
        return 80
    elif age <= 10:
        return 55
    elif age <= 20:
        return 30
    else:
        return 15


def _score_journal_proxy(paper: dict) -> float:
    """Score 0-100 as a rough proxy for journal quality.
    Papers with DOIs from known high-impact journals score higher."""
    score = 30  # base score

    # Having a DOI suggests proper publication
    if paper.get("doi"):
        score += 20

    journal = (paper.get("journal") or "").lower()

    # Top-tier medical journals
    top_journals = [
        "the lancet", "lancet", "new england journal of medicine", "n engl j med",
        "jama", "bmj", "nature medicine", "nature", "science",
        "annals of internal medicine", "plos medicine", "cell",
        "circulation", "journal of clinical oncology", "blood",
        "the bmj", "lancet oncology", "lancet infectious diseases",
    ]
    for tj in top_journals:
        if tj in journal:
            score += 50
            break
    else:
        # Mid-tier: journals with specific specialty terms
        if any(term in journal for term in ["review", "systematic", "meta-analy", "cochrane"]):
            score += 30
        elif any(term in journal for term in ["clinical", "medical", "american journal", "european journal", "british journal"]):
            score += 15

    return min(score, 100)


def _score_sample_size(abstract: str) -> float:
    """Score 0-100 based on sample size extracted from abstract."""
    n = _extract_sample_size(abstract)
    if n is None:
        return 30  # unknown → neutral

    if n >= 10000:
        return 100
    elif n >= 1000:
        return 85
    elif n >= 500:
        return 70
    elif n >= 100:
        return 55
    elif n >= 30:
        return 40
    else:
        return 20


def _score_reporting_quality(abstract: str) -> float:
    """Score 0-100 based on reporting guideline keywords in abstract."""
    if not abstract:
        return 20

    text = abstract.upper()
    count = sum(1 for kw in _REPORTING_KEYWORDS if kw.upper() in text)

    if count >= 3:
        return 100
    elif count == 2:
        return 80
    elif count == 1:
        return 60
    else:
        return 20


def grade_paper(paper: dict) -> dict:
    """Grade a single paper on evidence quality.

    Returns:
        {grade: "A"|"B"|"C"|"D", score: int, factors: {design, recency, journal, sample_size, reporting}}
    """
    pub_type = paper.get("publication_type", "Journal Article")
    abstract = paper.get("abstract", "")

    factors = {
        "design": _score_design(pub_type),
        "recency": _score_recency(paper.get("year", "")),
        "journal": _score_journal_proxy(paper),
        "sample_size": _score_sample_size(abstract),
        "reporting": _score_reporting_quality(abstract),
    }

    # Weighted composite score
    score = int(
        factors["design"] * 0.40
        + factors["recency"] * 0.20
        + factors["journal"] * 0.15
        + factors["sample_size"] * 0.15
        + factors["reporting"] * 0.10
    )

    if score >= 75:
        grade = "A"
    elif score >= 50:
        grade = "B"
    elif score >= 25:
        grade = "C"
    else:
        grade = "D"

    return {"grade": grade, "score": score, "factors": factors}


def grade_all_papers(papers: List[dict]) -> List[dict]:
    """Add 'evidence_grade' field to each paper dict.

    Mutates the paper dicts in-place and returns the list.
    """
    for paper in papers:
        paper["evidence_grade"] = grade_paper(paper)
    return papers
