import os
import re
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)


CUAD_CATEGORIES = {
    "Indemnity": {
        "keywords": ["indemnif", "hold harmless", "defend", "indemnity", "indemnitor", "indemnitee"],
        "regex": re.compile(
            r"(?:[^.\n]*?\b(?:indemnif[a-z]*|defend\s+(?:and\s+)?hold\s+harmless|hold\s+harmless)\b[^.\n]*?(?:\.[^.\n]+){0,2}\.?)",
            re.IGNORECASE
        ),
        "description": "Obligations to defend, indemnify, and hold harmless another party against third-party claims, liabilities, or losses."
    },
    "Termination": {
        "keywords": ["terminat", "notice of termination", "cure period", "material breach", "without cause", "for convenience"],
        "regex": re.compile(
            r"(?:[^.\n]*?\b(?:terminat[a-z]*\s+(?:for\s+(?:convenience|cause)|this\s+Agreement|immediately|upon)|written\s+notice\s+of\s+termination|material\s+breach)\b[^.\n]*?(?:\.[^.\n]+){0,2}\.?)",
            re.IGNORECASE
        ),
        "description": "Provisions defining how and when either party may terminate the contract (for cause, for convenience, notice windows, and cure periods)."
    },
    "Auto-Renewal": {
        "keywords": ["auto-renew", "automatic renewal", "automatically renew", "renewal term", "successive terms", "renew automatically", "successive"],
        "regex": re.compile(
            r"(?:[^.\n]*?\b(?:automatic(?:ally)?\s+renew[a-z]*|renewal\s+term|successive\s+(?:[a-z0-9]+\s+)?terms?|renew\s+for\s+additional)\b[^.\n]*?(?:\.[^.\n]+){0,2}\.?)",
            re.IGNORECASE
        ),
        "description": "Provisions where the agreement automatically extends for successive terms unless canceled within a prior notice window."
    },
    "Confidentiality": {
        "keywords": ["confidential information", "proprietary information", "non-disclosure", "trade secret", "obligation of confidentiality", "strict confidence"],
        "regex": re.compile(
            r"(?:[^.\n]*?\b(?:confidential\s+information|non-disclosure|proprietary\s+information|strict\s+confidence|keep\s+confidential)\b[^.\n]*?(?:\.[^.\n]+){0,2}\.?)",
            re.IGNORECASE
        ),
        "description": "Terms obligating recipient parties to maintain secrecy, restrict disclosure, and protect proprietary business or technical data."
    },
    "Governing Law": {
        "keywords": ["governing law", "governed by the laws", "jurisdiction", "exclusive venue", "courts of", "laws of the state"],
        "regex": re.compile(
            r"(?:[^.\n]*?\b(?:governed\s+by|laws\s+of\s+the\s+State|jurisdiction\s+of\s+the\s+courts|exclusive\s+venue)\b[^.\n]*?(?:\.[^.\n]+){0,2}\.?)",
            re.IGNORECASE
        ),
        "description": "The specific state, federal, or country jurisdiction and legal framework that governs the interpretation and disputes of the agreement."
    },
    "Limitation of Liability": {
        "keywords": ["limitation of liability", "consequential damages", "indirect damages", "aggregate liability", "in no event shall", "liability cap"],
        "regex": re.compile(
            r"(?:[^.\n]*?\b(?:in\s+no\s+event\s+shall|limitation\s+of\s+liability|aggregate\s+liability|consequential\s+damages)\b[^.\n]*?(?:\.[^.\n]+){0,2}\.?)",
            re.IGNORECASE
        ),
        "description": "Caps on financial damages and waivers of indirect, incidental, or consequential losses."
    },
    "Non-Compete / Restrictive Covenants": {
        "keywords": ["non-compete", "covenant not to compete", "non-solicitation", "solicit employees", "restrictive covenant"],
        "regex": re.compile(
            r"(?:[^.\n]*?\b(?:non-compete|covenant\s+not\s+to\s+compete|solicit\s+employees|non-solicitation|restrictive\s+covenant)\b[^.\n]*?(?:\.[^.\n]+){0,2}\.?)",
            re.IGNORECASE
        ),
        "description": "Restrictions preventing a party from competing in the same market or soliciting clients/employees during or after the contract term."
    },
    "Payment Terms": {
        "keywords": ["payment terms", "invoices", "net-30", "net 30", "fee schedule", "late fee", "due upon receipt", "monthly fee"],
        "regex": re.compile(
            r"(?:[^.\n]*?\b(?:payment\s+terms|invoices?\s+(?:payable|are|due)|net[\s-](?:15|30|45|60)|late\s+payment\s+fee|monthly\s+fee)\b[^.\n]*?(?:\.[^.\n]+){0,2}\.?)",
            re.IGNORECASE
        ),
        "description": "Compensation structure, invoicing cycles (e.g. Net-30), milestone releases, and late fee charges."
    }
}

def compute_iou(span1: Tuple[int, int], span2: Tuple[int, int]) -> float:
    """Compute Intersection over Union (IoU) of two 1D character offset spans."""
    start1, end1 = span1
    start2, end2 = span2
    intersection = max(0, min(end1, end2) - max(start1, start2))
    union = (end1 - start1) + (end2 - start2) - intersection
    if union <= 0:
        return 0.0
    return intersection / union

def deduplicate_clauses(
    clauses: List[Dict[str, Any]],
    iou_threshold: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Compares character offset spans of same-category clause detections from overlapping chunks
    and keeps only the higher-confidence one when spans overlap above a set IoU threshold.
    """
    if not clauses:
        return []

    by_category: Dict[str, List[Dict[str, Any]]] = {}
    for c in clauses:
        by_category.setdefault(c.get("category", ""), []).append(c)

    deduped: List[Dict[str, Any]] = []
    for cat, items in by_category.items():
        # Sort items by confidence score descending (keep highest confidence)
        sorted_items = sorted(items, key=lambda x: x.get("confidence_score", 0.0), reverse=True)
        kept_for_cat: List[Dict[str, Any]] = []

        for candidate in sorted_items:
            cand_span = (candidate.get("start_char", 0), candidate.get("end_char", 0))
            overlap = False
            for kept in kept_for_cat:
                kept_span = (kept.get("start_char", 0), kept.get("end_char", 0))
                if compute_iou(cand_span, kept_span) >= iou_threshold:
                    overlap = True
                    break
            if not overlap:
                kept_for_cat.append(candidate)

        deduped.extend(kept_for_cat)

    deduped.sort(key=lambda c: (c.get("start_char", 0), c.get("end_char", 0)))
    return deduped


class ClauseExtractor:
    """
    Extracts key clause categories from contract text matching CUAD benchmark categories.
    Combines fine-tuned RoBERTa question-answering with CUAD regex/keyword fallback.
    """
    CONFIDENCE_THRESHOLD = 0.65
    _model = None
    _tokenizer = None
    _model_initialized = False

    @classmethod
    def get_model(cls):
        """Lazy loader for fine-tuned RoBERTa checkpoint mirroring EntityExtractor resilience."""
        if not cls._model_initialized:
            cls._model_initialized = True
            model_path = os.getenv("CLAUSE_MODEL_PATH", "./models/roberta-cuad-clause-extractor")
            if not os.path.isabs(model_path):
                # Check relative to repo root as well
                repo_root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", model_path.lstrip("./")))
                if os.path.exists(repo_root_path):
                    model_path = repo_root_path

            if os.path.exists(model_path) and os.path.isdir(model_path):
                try:
                    import torch
                    from transformers import AutoTokenizer, AutoModelForQuestionAnswering
                    cls._tokenizer = AutoTokenizer.from_pretrained(model_path)
                    cls._model = AutoModelForQuestionAnswering.from_pretrained(model_path)
                    logger.info("Successfully loaded fine-tuned RoBERTa clause extractor from %s", model_path)
                except Exception as e:
                    logger.warning(
                        "Failed loading RoBERTa checkpoint from %s (%s). Falling back to rule-based extractor.",
                        model_path, e
                    )
                    cls._model = None
                    cls._tokenizer = None
            else:
                logger.info(
                    "RoBERTa checkpoint not found at %s. Falling back to rule-based extractor.",
                    model_path
                )
                cls._model = None
                cls._tokenizer = None

        return cls._model, cls._tokenizer

    @classmethod
    def extract_clauses(
        cls,
        text: str,
        pages_metadata: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract clauses matching target CUAD categories with verbatim excerpts,
        page/character offsets, and descriptions.
        """
        if not text or not text.strip():
            return []

        model, tokenizer = cls.get_model()
        if model is not None and tokenizer is not None:
            try:
                extracted = cls._extract_clauses_neural(text, pages_metadata, model, tokenizer)
                if extracted:
                    deduped = deduplicate_clauses(extracted, iou_threshold=0.5)
                    for c in deduped:
                        c.pop("confidence_score", None)
                    return deduped
            except Exception as e:
                logger.warning("Neural clause extraction failed (%s). Falling back to regex extraction.", e)

        extracted = cls._extract_clauses_regex(text, pages_metadata)
        deduped = deduplicate_clauses(extracted, iou_threshold=0.5)
        for c in deduped:
            c.pop("confidence_score", None)
        return deduped

    @classmethod
    def _extract_clauses_neural(
        cls,
        text: str,
        pages_metadata: List[Dict[str, Any]],
        model: Any,
        tokenizer: Any
    ) -> List[Dict[str, Any]]:
        """Run fine-tuned RoBERTa QA per chunk and map detected spans to global offsets."""
        import torch
        from app.services.chunker import DocumentChunker

        chunks = DocumentChunker.chunk_text(text, max_words_per_chunk=350, overlap_words=50)
        extracted: List[Dict[str, Any]] = []

        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device)
        model.eval()

        for chunk in chunks:
            chunk_text = chunk["text"]
            chunk_start = chunk["start_char"]

            for category, config in CUAD_CATEGORIES.items():
                question = f"What is the clause regarding {category}?"
                inputs = tokenizer(
                    question,
                    chunk_text,
                    return_tensors="pt",
                    truncation="only_second",
                    max_length=512
                )
                inputs = {k: v.to(device) for k, v in inputs.items()}

                with torch.no_grad():
                    outputs = model(**inputs)
                    start_logits = outputs.start_logits[0]
                    end_logits = outputs.end_logits[0]

                start_idx = int(torch.argmax(start_logits))
                end_idx = int(torch.argmax(end_logits))

                if end_idx >= start_idx and start_idx > 0:
                    start_prob = float(torch.softmax(start_logits, dim=-1)[start_idx])
                    end_prob = float(torch.softmax(end_logits, dim=-1)[end_idx])
                    confidence = round((start_prob + end_prob) / 2.0, 3)

                    if confidence >= cls.CONFIDENCE_THRESHOLD:
                        answer_tokens = inputs["input_ids"][0][start_idx:end_idx + 1]
                        clause_text = tokenizer.decode(answer_tokens, skip_special_tokens=True).strip()

                        if len(clause_text) >= 20:
                            rel_pos = chunk_text.find(clause_text)
                            if rel_pos != -1:
                                abs_start = chunk_start + rel_pos
                                abs_end = abs_start + len(clause_text)
                            else:
                                abs_start = chunk_start
                                abs_end = chunk_start + len(clause_text)

                            page_num = cls._find_page_number(abs_start, pages_metadata)
                            extracted.append({
                                "category": category,
                                "clause_text": clause_text,
                                "confidence_score": confidence,
                                "start_char": abs_start,
                                "end_char": abs_end,
                                "page_number": page_num,
                                "description": config["description"]
                            })

        return extracted

    @classmethod
    def _extract_clauses_regex(
        cls,
        text: str,
        pages_metadata: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Deterministic regex and keyword feature extraction for CUAD benchmark categories."""
        extracted = []
        seen_spans = set()

        for category, config in CUAD_CATEGORIES.items():
            pattern = config["regex"]
            keywords = config["keywords"]

            for match in pattern.finditer(text):
                matched_text = match.group(0).strip()
                if len(matched_text) < 20:
                    continue

                start_char = match.start()
                end_char = match.end()

                # Deduplicate overlapping spans
                span_key = (category, start_char // 40)
                if span_key in seen_spans:
                    continue
                seen_spans.add(span_key)

                # Compute keyword density confidence
                kw_hits = sum(1 for kw in keywords if kw.lower() in matched_text.lower())
                confidence = min(0.98, max(0.72, 0.70 + (kw_hits * 0.08)))

                if confidence >= cls.CONFIDENCE_THRESHOLD:
                    page_num = cls._find_page_number(start_char, pages_metadata)
                    extracted.append({
                        "category": category,
                        "clause_text": matched_text,
                        "confidence_score": round(confidence, 3),
                        "start_char": start_char,
                        "end_char": end_char,
                        "page_number": page_num,
                        "description": config["description"]
                    })

        extracted.sort(key=lambda c: c["start_char"])
        return extracted

    @classmethod
    def _find_page_number(cls, char_offset: int, pages_metadata: List[Dict[str, Any]]) -> int:
        """Find the corresponding 1-indexed page number for a given character offset."""
        if not pages_metadata:
            return max(1, (char_offset // 2000) + 1)

        for page in pages_metadata:
            if page.get("start_char", 0) <= char_offset <= page.get("end_char", float("inf")):
                return page.get("page_number", 1)

        return 1
