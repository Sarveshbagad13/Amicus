import re
import logging
from typing import Literal

logger = logging.getLogger(__name__)

# --- Bill signal patterns (searched in first 3000 chars) ---
_BILL_PATTERNS = [
    re.compile(r"\bAN\s+ACT\b", re.IGNORECASE),
    re.compile(r"\bBe\s+it\s+enacted\s+by\b", re.IGNORECASE),
    re.compile(r"^SECTION\s+\d+\.", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^TITLE\s+[IVX]+\b", re.IGNORECASE | re.MULTILINE),
    re.compile(r"\bIN\s+THE\s+(?:SENATE|HOUSE)\s+OF\s+REPRESENTATIVES\b", re.IGNORECASE),
    re.compile(r"\bCongress\s+(?:finds|declares|hereby)\b", re.IGNORECASE),
]

# --- Contract signal patterns ---
_CONTRACT_PATTERNS = [
    re.compile(r"\bWHEREAS\b", re.IGNORECASE),
    re.compile(r"\bthe\s+Parties?\s+(?:agree|hereby\s+agree)\b", re.IGNORECASE),
    re.compile(r"\bthis\s+Agreement\b", re.IGNORECASE),
    re.compile(r"\bEffective\s+Date\b", re.IGNORECASE),
    re.compile(r"\bIN\s+WITNESS\s+WHEREOF\b", re.IGNORECASE),
    re.compile(r"\bNOW,?\s+THEREFORE\b", re.IGNORECASE),
]

DocType = Literal["BILL", "CONTRACT", "UNSUPPORTED"]


def detect_document_type(text: str) -> DocType:
    """
    Classify an uploaded legal document as a legislative bill/statute,
    a commercial contract, or an unsupported document type, using regex
    heuristics on the document preamble.

    Strategy:
      - Scan the first 3,000 characters for high-precision bill markers first.
      - If any bill marker matches, return "BILL" immediately (early exit).
      - Otherwise scan for contract markers.
      - If any contract marker matches, return "CONTRACT" (early exit).
      - If neither set matches, return "UNSUPPORTED" — the document is
        genuinely ambiguous or out of scope (e.g. court transcripts, wills,
        demand letters, deeds). Callers must not assume CONTRACT as a
        default; doing so causes hallucinated contract-shaped summaries.

    Args:
        text: Full extracted document text.

    Returns:
        "BILL", "CONTRACT", or "UNSUPPORTED"
    """
    if not text or not text.strip():
        logger.debug("detect_document_type: empty text → UNSUPPORTED")
        return "UNSUPPORTED"

    # Use only preamble for performance — signals are densest at the top
    preamble = text[:3000]

    for pattern in _BILL_PATTERNS:
        if pattern.search(preamble):
            logger.info(
                "detect_document_type: bill marker matched (%s) → BILL",
                pattern.pattern[:40]
            )
            return "BILL"

    for pattern in _CONTRACT_PATTERNS:
        if pattern.search(preamble):
            logger.info(
                "detect_document_type: contract marker matched (%s) → CONTRACT",
                pattern.pattern[:40]
            )
            return "CONTRACT"

    logger.info(
        "detect_document_type: no bill or contract markers found → UNSUPPORTED"
    )
    return "UNSUPPORTED"
