import re
from typing import List, Dict, Any

class ModelGuardrails:
    """
    Enforces PRD Section 7.2 behavioral guardrails:
    - Never guarantee legal enforceability or validity.
    - Never predict litigation/dispute outcomes.
    - Never offer prescriptive legal advice; enforce strictly neutral, descriptive language.
    """

    PROHIBITED_PATTERNS = [
        # Enforceability / Validity claims
        (re.compile(r"\b(?:this|the)\s+(?:contract|agreement|clause)\s+is\s+(?:legally\s+binding|enforceable|unenforceable|valid\s+in\s+court|invalid)\b", re.I),
         "The document contains provisions regarding"),
        (re.compile(r"\b(?:is|are)\s+(?:not\s+enforceable|legally\s+null\s+and\s+void|unenforceable\s+under\s+law)\b", re.I),
         "contains specific standard terms regarding"),
        # Outcome predictions
        (re.compile(r"\b(?:you\s+will\s+win|you\s+will\s+lose|the\s+court\s+will\s+rule|will\s+hold\s+you\s+liable)\b", re.I),
         "the document outlines conditions for"),
        # Prescriptive legal advice
        (re.compile(r"\b(?:i\s+advise\s+you\s+to|you\s+must\s+strike|you\s+should\s+delete|you\s+should\s+refuse\s+to\s+sign)\b", re.I),
         "non-lawyer signers commonly note"),
        (re.compile(r"\b(?:this\s+contract\s+is\s+safe\s+to\s+sign|you\s+can\s+safely\s+sign)\b", re.I),
         "The document outlines agreed terms for review")
    ]

    LEGAL_DISCLAIMER_TEXT = (
        "Amicus is an AI-powered document analysis tool designed for informational and educational "
        "purposes only. Amicus is not a law firm, does not provide legal advice, and does not create "
        "an attorney-client relationship. Always consult a qualified attorney for contract review before signing."
    )

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """
        Sanitize generated summaries and takeaway points to guarantee adherence
        to non-advisory legal guardrails.
        """
        if not text:
            return ""

        sanitized = text
        for pattern, replacement in cls.PROHIBITED_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)

        return sanitized.strip()

    @classmethod
    def sanitize_takeaways(cls, takeaways: List[str]) -> List[str]:
        """Sanitize a list of key takeaway bullet points."""
        cleaned = []
        for t in takeaways:
            s = cls.sanitize_text(t)
            if s and len(s) > 10:
                cleaned.append(s)
        return cleaned

    @classmethod
    def get_compliance_payload(cls) -> Dict[str, Any]:
        """Return structured compliance disclaimer metadata."""
        return {
            "is_legal_advice": False,
            "disclaimer": cls.LEGAL_DISCLAIMER_TEXT,
            "version": "1.0.0"
        }
