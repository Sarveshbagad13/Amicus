import os
import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Robust contract entity patterns
DATE_REGEX = re.compile(
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*|\s+)\d{4}\b|"
    r"\b\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:,\s*|\s+)\d{4}\b|"
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|"
    r"\b\d{1,2}\s+(?:days?|months?|years?)\s+(?:from|after|prior\s+to|following|of\s+written\s+notice)\b",
    re.IGNORECASE
)

MONEY_REGEX = re.compile(
    r"\$\s*\d+(?:,\d{3})*(?:\.\d{1,2})?(?:\s*(?:USD|dollars|million|thousand|k))?|"
    r"\b\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:USD|EUR|GBP|dollars)\b|"
    r"\b\d+(?:\.\d+)?%\s*(?:per\s+month|per\s+annum|late\s+fee|interest|retainer)?",
    re.IGNORECASE
)

GOVERNING_LAW_REGEX = re.compile(
    r"(?:governed\s+by|laws\s+of|jurisdiction\s+of|courts\s+of|laws\s+of\s+the\s+State\s+of|State\s+of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
    re.IGNORECASE
)

KNOWN_JURISDICTIONS = {
    "delaware", "california", "new york", "texas", "florida", "illinois",
    "massachusetts", "washington", "colorado", "england", "wales", "united kingdom"
}

PARTY_REGEX = re.compile(
    r"(?:between|by\s+and\s+between)\s+([A-Z0-9][A-Za-z0-9\s,\.\(\)]+?)\s+(?:and|,)\s+([A-Z0-9][A-Za-z0-9\s,\.\(\)]+?)(?:\s*\(|\s*\.|,\s*dated|\s+dated|\s+effective)",
    re.IGNORECASE
)

class EntityExtractor:
    """
    Extracts high-value contract entities (Parties, Dates, Monetary terms, Governing jurisdictions)
    using spaCy NER with regex-assisted contextual boundaries.
    """
    _nlp = None
    _nlp_checked = False
    _extraction_mode = "full"

    @classmethod
    def get_extraction_mode(cls) -> str:
        """Returns 'full' if spaCy is loaded, or 'reduced' if fallback mode is active."""
        cls.get_nlp()
        return cls._extraction_mode

    @classmethod
    def get_nlp(cls):
        if not cls._nlp_checked:
            cls._nlp_checked = True
            model_name = os.getenv("SPACY_MODEL_NAME", "en_core_web_sm")
            try:
                import spacy
                try:
                    cls._nlp = spacy.load(model_name)
                    cls._extraction_mode = "full"
                    logger.info("Successfully loaded spaCy model '%s'", model_name)
                except Exception as load_err:
                    cls._nlp = None
                    cls._extraction_mode = "reduced"
                    logger.warning(
                        "Failed to load spaCy model '%s': %s. Falling back to rule-based extractor in reduced mode.",
                        model_name, load_err
                    )
            except Exception as e:
                cls._nlp = None
                cls._extraction_mode = "reduced"
                logger.warning("spaCy package load failed (%s). Operating in reduced entity extraction mode.", e)
        return cls._nlp

    @classmethod
    def extract_entities(cls, text: str) -> List[Dict[str, Any]]:
        """Extract structured entities matching contract schema."""
        if not text or not text.strip():
            return []

        entities = []
        seen = set()

        nlp = cls.get_nlp()

        # 1. spaCy Model Extraction if available
        if nlp is not None and "ner" in nlp.pipe_names:
            try:
                doc = nlp(text[:25000])
                for ent in doc.ents:
                    ent_text = ent.text.strip()
                    if len(ent_text) < 2 or ent_text in seen:
                        continue

                    entity_type = None

                    if ent.label_ in ("ORG", "PERSON"):
                        entity_type = "PARTY"
                    elif ent.label_ in ("DATE", "TIME"):
                        entity_type = "DATE"
                    elif ent.label_ in ("MONEY", "PERCENT"):
                        entity_type = "MONEY"
                    elif ent.label_ == "GPE":
                        entity_type = "GOVERNING_LAW"

                    if entity_type:
                        start = max(0, ent.start_char - 40)
                        end = min(len(text), ent.end_char + 40)
                        context = text[start:end].replace("\n", " ").strip()

                        seen.add(ent_text)
                        entities.append({
                            "entity_type": entity_type,
                            "text": ent_text,
                            "context": f"...{context}..."
                        })
            except Exception as e:
                logger.warning(f"spaCy processing error: {e}")

        # 2. Contracting Parties
        preamble = text[:2500]
        party_match = PARTY_REGEX.search(preamble)
        if party_match:
            p1, p2 = party_match.group(1).strip(), party_match.group(2).strip()
            for p in (p1, p2):
                p_clean = re.sub(r'^(?:the\s+|a\s+|an\s+)', '', p, flags=re.I).strip(' ,.;')
                if len(p_clean) > 2 and p_clean not in seen and not p_clean.lower().startswith("this"):
                    seen.add(p_clean)
                    entities.insert(0, {
                        "entity_type": "PARTY",
                        "text": p_clean,
                        "context": f"...between {p1} and {p2}..."
                    })

        # 3. Money / Financial Terms
        for match in MONEY_REGEX.finditer(text):
            val = match.group(0).strip()
            if val not in seen and len(val) >= 2:
                seen.add(val)
                start = max(0, match.start() - 35)
                end = min(len(text), match.end() + 35)
                entities.append({
                    "entity_type": "MONEY",
                    "text": val,
                    "context": f"...{text[start:end].replace('\n', ' ').strip()}..."
                })

        # 4. Dates
        for match in DATE_REGEX.finditer(text):
            val = match.group(0).strip()
            if val not in seen and len(val) > 3:
                seen.add(val)
                start = max(0, match.start() - 35)
                end = min(len(text), match.end() + 35)
                entities.append({
                    "entity_type": "DATE",
                    "text": val,
                    "context": f"...{text[start:end].replace('\n', ' ').strip()}..."
                })

        # 5. Governing Law
        for match in GOVERNING_LAW_REGEX.finditer(text):
            val = match.group(1).strip() if match.group(1) else ""
            if val and val not in seen and len(val) > 2:
                seen.add(val)
                start = max(0, match.start() - 25)
                end = min(len(text), match.end() + 25)
                state_name = f"State of {val}" if not val.lower().startswith("state") else val
                entities.append({
                    "entity_type": "GOVERNING_LAW",
                    "text": state_name,
                    "context": f"...{text[start:end].replace('\n', ' ').strip()}..."
                })

        # Check known jurisdictions if not already found
        for word in KNOWN_JURISDICTIONS:
            if word in text.lower():
                j_title = word.title()
                if j_title not in seen and f"State of {j_title}" not in seen:
                    idx = text.lower().find(word)
                    start = max(0, idx - 25)
                    end = min(len(text), idx + len(word) + 25)
                    seen.add(j_title)
                    entities.append({
                        "entity_type": "GOVERNING_LAW",
                        "text": f"State of {j_title}" if j_title.lower() not in ("england", "wales", "united kingdom") else j_title,
                        "context": f"...{text[start:end].replace('\n', ' ').strip()}..."
                    })
                    break

        return entities

