import os
import re
import logging
from typing import List, Dict, Any, Tuple
from app.services.guardrails import ModelGuardrails
from app.services.chunker import DocumentChunker

logger = logging.getLogger(__name__)

class ContractSummarizer:
    """
    Generates plain-language abstractive contract summaries and bullet takeaways.
    Implements a hierarchical Map-Reduce approach for handling multi-page contracts
    within transformer context bounds, enforced by ModelGuardrails.
    """
    _model = None
    _tokenizer = None
    _model_initialized = False

    @classmethod
    def get_model(cls):
        """Lazy loader for fine-tuned BART checkpoint mirroring EntityExtractor resilience."""
        if not cls._model_initialized:
            cls._model_initialized = True
            model_path = os.getenv("SUMMARIZATION_MODEL_PATH", "./models/bart-billsum-warmup")
            if not os.path.isabs(model_path):
                repo_root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", model_path.lstrip("./")))
                if os.path.exists(repo_root_path):
                    model_path = repo_root_path

            if os.path.exists(model_path) and os.path.isdir(model_path):
                try:
                    import torch
                    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
                    cls._tokenizer = AutoTokenizer.from_pretrained(model_path)
                    cls._model = AutoModelForSeq2SeqLM.from_pretrained(model_path)
                    logger.info("Successfully loaded fine-tuned BART summarization model from %s", model_path)
                except Exception as e:
                    logger.warning(
                        "Failed loading BART checkpoint from %s (%s). Falling back to template summarizer.",
                        model_path, e
                    )
                    cls._model = None
                    cls._tokenizer = None
            else:
                logger.info(
                    "BART checkpoint not found at %s. Falling back to template summarizer.",
                    model_path
                )
                cls._model = None
                cls._tokenizer = None

        return cls._model, cls._tokenizer

    @classmethod
    def generate_summary(
        cls,
        text: str,
        extracted_clauses: List[Dict[str, Any]] = None,
        extracted_entities: List[Dict[str, Any]] = None
    ) -> Tuple[str, List[str], int]:
        """
        Generate a structured plain-English summary and key takeaways.
        Uses neural BART summarization over chunked text when available,
        falling back to rule-based template logic otherwise.
        Returns: (summary_text, key_takeaways, token_count)
        """
        if not text or not text.strip():
            return (
                "No content available to summarize.",
                ["Empty document submitted."],
                0
            )

        model, tokenizer = cls.get_model()
        if model is not None and tokenizer is not None:
            try:
                return cls._generate_summary_neural(
                    text, model, tokenizer, extracted_clauses, extracted_entities
                )
            except Exception as e:
                logger.warning("Neural summarization failed (%s). Falling back to template summarizer.", e)

        return cls._generate_summary_template(text, extracted_clauses, extracted_entities)

    @classmethod
    def _generate_summary_neural(
        cls,
        text: str,
        model: Any,
        tokenizer: Any,
        extracted_clauses: List[Dict[str, Any]] = None,
        extracted_entities: List[Dict[str, Any]] = None
    ) -> Tuple[str, List[str], int]:
        """Run Map-Reduce summarization: summarize each DocumentChunker chunk, then synthesize."""
        import torch

        chunks = DocumentChunker.chunk_text(text, max_words_per_chunk=500, overlap_words=50)
        if not chunks:
            return cls._generate_summary_template(text, extracted_clauses, extracted_entities)

        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device)
        model.eval()

        # Map phase: generate abstractive per-chunk summaries
        chunk_summaries = []
        for chunk in chunks:
            chunk_input = f"summarize legal document: {chunk['text']}"
            inputs = tokenizer(
                chunk_input,
                max_length=1024,
                truncation=True,
                return_tensors="pt"
            ).to(device)

            with torch.no_grad():
                summary_ids = model.generate(
                    inputs["input_ids"],
                    max_length=200,
                    min_length=40,
                    num_beams=2,
                    no_repeat_ngram_size=3,
                    early_stopping=True
                )
            summary_piece = tokenizer.decode(summary_ids[0], skip_special_tokens=True).strip()
            if summary_piece:
                chunk_summaries.append(summary_piece)

        # Reduce phase: second synthesis pass combining per-chunk summaries
        if len(chunk_summaries) > 1:
            combined_text = " ".join(chunk_summaries)
            synthesis_input = f"synthesize executive contract summary: {combined_text}"
            inputs = tokenizer(
                synthesis_input,
                max_length=1024,
                truncation=True,
                return_tensors="pt"
            ).to(device)

            with torch.no_grad():
                final_ids = model.generate(
                    inputs["input_ids"],
                    max_length=350,
                    min_length=100,
                    num_beams=3,
                    no_repeat_ngram_size=3,
                    early_stopping=True
                )
            final_summary = tokenizer.decode(final_ids[0], skip_special_tokens=True).strip()
        elif chunk_summaries:
            final_summary = chunk_summaries[0]
        else:
            return cls._generate_summary_template(text, extracted_clauses, extracted_entities)

        sanitized_summary = ModelGuardrails.sanitize_text(final_summary)

        # Build takeaways from synthesis and extracted provisions
        takeaways = []
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', sanitized_summary) if len(s.strip()) > 20]
        for s in sentences[:4]:
            takeaways.append(s)

        if len(takeaways) < 3 and extracted_clauses:
            for c in extracted_clauses:
                cat = c.get("category")
                if cat and f"{cat} Clause" not in [t[:30] for t in takeaways]:
                    takeaways.append(f"{cat}: {c.get('clause_text', '')[:100]}...")
                if len(takeaways) >= 4:
                    break

        if not takeaways:
            takeaways = [
                "Commercial agreement establishing contractual terms.",
                "Review notice intervals and deliverable specifications.",
                "Verify payment milestones and liability protections."
            ]

        token_count = len(sanitized_summary.split())
        return (sanitized_summary, takeaways, token_count)

    @classmethod
    def _generate_summary_template(
        cls,
        text: str,
        extracted_clauses: List[Dict[str, Any]] = None,
        extracted_entities: List[Dict[str, Any]] = None
    ) -> Tuple[str, List[str], int]:
        """Template-based synthesis fallback preserving exact PRD schema."""
        parties = [e["text"] for e in (extracted_entities or []) if e.get("entity_type") == "PARTY"]
        dates = [e["text"] for e in (extracted_entities or []) if e.get("entity_type") == "DATE"]
        monies = [e["text"] for e in (extracted_entities or []) if e.get("entity_type") == "MONEY"]
        laws = [e["text"] for e in (extracted_entities or []) if e.get("entity_type") == "GOVERNING_LAW"]

        party_str = " and ".join(parties[:2]) if len(parties) >= 2 else (parties[0] if parties else "the contracting parties")
        date_str = f" dated {dates[0]}" if dates else ""
        law_str = f" under the jurisdiction of {laws[0]}" if laws else ""
        fee_str = f" involving financial terms of {', '.join(monies[:2])}" if monies else ""

        # Clause lookup
        clause_map = {}
        for c in (extracted_clauses or []):
            cat = c.get("category")
            if cat not in clause_map:
                clause_map[cat] = c.get("clause_text", "")

        # 2. Reduce Stage: Construct cohesive multi-paragraph synthesis
        p1 = (
            f"This commercial agreement establishes contractual terms between {party_str}{date_str}. "
            f"The document sets forth mutual operational obligations, service deliverables, and binding governance rules{law_str}."
        )

        # Paragraph 2: Financial & Payment Terms
        if "Payment Terms" in clause_map or monies:
            payment_snippet = clause_map.get("Payment Terms", "")
            p2 = (
                f"Financial and Payment Terms: The agreement outlines payment schedules{fee_str}. "
                + (f"Specifically, {payment_snippet[:220].strip()}... " if payment_snippet else "Invoices are subject to agreed delivery acceptance and scheduled settlement cycles.")
            )
        else:
            p2 = (
                "Financial and Payment Terms: The agreement specifies mutual consideration and standard invoicing procedures "
                "contingent upon satisfactory delivery of defined milestones."
            )

        # Paragraph 3: Termination & Term
        if "Termination" in clause_map or "Auto-Renewal" in clause_map:
            term_details = []
            if "Termination" in clause_map:
                term_details.append(f"Termination provisions outline that {clause_map['Termination'][:180].strip()}...")
            if "Auto-Renewal" in clause_map:
                term_details.append(f"Auto-renewal terms state that {clause_map['Auto-Renewal'][:180].strip()}...")
            p3 = f"Term & Termination: {' '.join(term_details)}"
        else:
            p3 = (
                "Term & Termination: The agreement remains in effect for the designated contract term, "
                "allowing termination by written notice upon material breach or standard notice intervals."
            )

        # Paragraph 4: Liabilities, Indemnities & Restrictive Covenants
        liab_details = []
        if "Indemnity" in clause_map:
            liab_details.append(f"Indemnification: {clause_map['Indemnity'][:180].strip()}...")
        if "Limitation of Liability" in clause_map:
            liab_details.append(f"Liability Limits: {clause_map['Limitation of Liability'][:180].strip()}...")
        if "Non-Compete / Restrictive Covenants" in clause_map:
            liab_details.append(f"Restrictive Covenants: {clause_map['Non-Compete / Restrictive Covenants'][:180].strip()}...")

        if liab_details:
            p4 = f"Liabilities & Covenants: {' '.join(liab_details)}"
        else:
            p4 = (
                "Liabilities & Covenants: Standard confidentiality and limitation of liability provisions "
                "protect proprietary materials and govern dispute remedies."
            )

        summary_paragraphs = [p1, p2, p3, p4]
        raw_summary = "\n\n".join(summary_paragraphs)

        # 3. Generate Key Takeaways (3-5 crisp bullets)
        takeaways = []
        if monies:
            takeaways.append(f"Financial Terms: Identified payments including {', '.join(monies[:3])}.")
        if "Payment Terms" in clause_map:
            takeaways.append(f"Payment Schedule: {clause_map['Payment Terms'][:120]}...")
        if "Auto-Renewal" in clause_map:
            takeaways.append(f"Auto-Renewal Detected: Contract automatically extends unless advance written notice is provided.")
        if "Termination" in clause_map:
            takeaways.append(f"Termination Notice: Governed by specific notice and cure periods before termination.")
        if "Indemnity" in clause_map:
            takeaways.append(f"Indemnity Obligation: Includes defense and indemnification liabilities between parties.")
        if "Limitation of Liability" in clause_map:
            takeaways.append(f"Liability Cap: Specific aggregate limitations on damages and liability recovery.")
        if laws:
            takeaways.append(f"Governing Jurisdiction: Subject to the legal venue of {laws[0]}.")

        if not takeaways:
            takeaways = [
                "Standard commercial terms established between parties.",
                "Review notice windows for termination and deliverable milestones.",
                "Verify payment schedules and deliverable acceptance criteria."
            ]

        # Apply Model Guardrails (PRD Section 7.2)
        sanitized_summary = ModelGuardrails.sanitize_text(raw_summary)
        sanitized_takeaways = ModelGuardrails.sanitize_takeaways(takeaways[:5])

        token_count = len(sanitized_summary.split()) + sum(len(t.split()) for t in sanitized_takeaways)

        return sanitized_summary, sanitized_takeaways, token_count


class BillSummarizer:
    """
    Generates plain-language summaries for legislative bills and statutes.
    Mirrors ContractSummarizer's interface (same return tuple) but builds
    its content from bill-specific structural signals rather than CUAD
    clause categories — bills have no Payment Terms, Indemnity, etc.

    Does NOT require extracted_clauses (bills produce zero CUAD matches).
    """

    # Regex for short title extraction
    _SHORT_TITLE_RE = re.compile(
        r"(?:SHORT\s+TITLE[.\-—:]*\s*(?:This\s+(?:Act|title)\s+may\s+be\s+cited\s+as\s+[\"'\u2018\u201c]?))"
        r"|(?:may\s+be\s+cited\s+as\s+[\"'\u2018\u201c]?)([^\"'\u2019\u201d\n]{5,80})",
        re.IGNORECASE,
    )
    _ENACTED_RE = re.compile(r"Be\s+it\s+enacted\s+by", re.IGNORECASE)
    _SECTION_COUNT_RE = re.compile(r"^(?:SEC\.|SECTION)\s+\d+", re.IGNORECASE | re.MULTILINE)
    _TITLE_COUNT_RE = re.compile(r"^TITLE\s+[IVX]+\b", re.IGNORECASE | re.MULTILINE)
    _APPROPRIATION_RE = re.compile(
        r"(?:is\s+hereby\s+appropriated|authorized\s+to\s+(?:be\s+)?appropriated|"
        r"there\s+(?:is|are)\s+(?:authorized|appropriated)|grant\s+of)",
        re.IGNORECASE,
    )
    _EFFECTIVE_DATE_CONTEXT_RE = re.compile(
        r"(?:effective|takes?\s+effect|enacted|sunset|no\s+later\s+than).{0,60}",
        re.IGNORECASE,
    )
    _REPORTING_RE = re.compile(
        r"(?:shall\s+submit\s+a\s+report|Secretary\s+shall|Administrator\s+shall|"
        r"within\s+\d+\s+days|annual\s+report|report\s+to\s+Congress)",
        re.IGNORECASE,
    )

    @classmethod
    def generate_summary(
        cls,
        text: str,
        extracted_entities: List[Dict[str, Any]] = None,
    ) -> Tuple[str, List[str], int]:
        """
        Generate a structured plain-English summary of a legislative bill.

        Args:
            text: Full extracted bill text.
            extracted_entities: Output of EntityExtractor.extract_entities().

        Returns:
            (summary_text, key_takeaways, token_count) — identical shape to
            ContractSummarizer.generate_summary().
        """
        if not text or not text.strip():
            return (
                "No content available to summarize.",
                ["Empty document submitted."],
                0,
            )

        entities = extracted_entities or []
        monies = [e["text"] for e in entities if e.get("entity_type") == "MONEY"]
        dates = [e["text"] for e in entities if e.get("entity_type") == "DATE"]

        preamble = text[:4000]

        # ── P1: Identity ────────────────────────────────────────────────────
        short_title = None
        title_match = cls._SHORT_TITLE_RE.search(preamble)
        if title_match:
            short_title = (title_match.group(1) or "").strip(' "\'')
        has_enacting_clause = bool(cls._ENACTED_RE.search(preamble))

        section_count = len(cls._SECTION_COUNT_RE.findall(text))
        title_count = len(cls._TITLE_COUNT_RE.findall(text))

        structure_desc = []
        if title_count > 0:
            structure_desc.append(f"{title_count} title{'s' if title_count != 1 else ''}")
        if section_count > 0:
            structure_desc.append(f"{section_count} section{'s' if section_count != 1 else ''}")
        structure_str = " and ".join(structure_desc) if structure_desc else "multiple provisions"

        if short_title:
            p1 = (
                f"This legislative document, cited as the \"{short_title}\", "
                f"{'contains an enacting clause and ' if has_enacting_clause else ''}"
                f"is organized into {structure_str}."
            )
        else:
            p1 = (
                f"This legislative bill "
                f"{'contains an enacting clause and ' if has_enacting_clause else ''}"
                f"is organized into {structure_str}."
            )

        # ── P2: Appropriations & Fiscal Impact ──────────────────────────────
        has_appropriations = bool(cls._APPROPRIATION_RE.search(text))
        if monies or has_appropriations:
            money_str = (
                f"involving appropriations of {', '.join(monies[:3])}"
                if monies
                else "with authorized appropriations"
            )
            p2 = (
                f"Fiscal Impact: The bill includes funding provisions {money_str}. "
                f"{'Additional monetary authorizations may apply across individual sections.' if len(monies) > 3 else ''}"
            ).strip()
        else:
            p2 = (
                "Fiscal Impact: This bill does not appear to include direct monetary "
                "appropriations. Funding implications, if any, may derive from "
                "regulatory mandates on existing agency budgets."
            )

        # ── P3: Key Dates & Effective Period ────────────────────────────────
        # Filter dates that appear near effective/sunset context
        effective_dates = []
        for match in cls._EFFECTIVE_DATE_CONTEXT_RE.finditer(text[:8000]):
            snippet = match.group(0)
            for d in dates:
                if d in snippet and d not in effective_dates:
                    effective_dates.append(d)

        if effective_dates:
            date_list = "; ".join(effective_dates[:3])
            p3 = (
                f"Key Dates: The bill references the following effective or operative dates: "
                f"{date_list}. Parties and agencies should note applicable deadlines for compliance."
            )
        elif dates:
            p3 = (
                f"Key Dates: The document references dates including {', '.join(dates[:3])}. "
                f"Specific effective or sunset dates should be verified against the enrolled bill text."
            )
        else:
            p3 = (
                "Key Dates: No specific effective or sunset dates were identified in the analyzed text. "
                "The effective date may follow standard statutory default rules (e.g., 60 days after enactment)."
            )

        # ── P4: Reporting & Compliance Requirements ──────────────────────────
        reporting_matches = cls._REPORTING_RE.findall(text)
        unique_reporting = list(dict.fromkeys(m.strip() for m in reporting_matches))[:4]

        if unique_reporting:
            p4 = (
                f"Reporting & Compliance: The bill imposes reporting or administrative "
                f"obligations, including provisions requiring: "
                f"{'; '.join(unique_reporting[:3])}."
            )
        else:
            p4 = (
                "Reporting & Compliance: No explicit reporting mandates were identified. "
                "Standard agency rulemaking and implementation timelines may apply."
            )

        summary_paragraphs = [p1, p2, p3, p4]
        raw_summary = "\n\n".join(summary_paragraphs)

        # ── Key Takeaways ────────────────────────────────────────────────────
        takeaways = []
        if short_title:
            takeaways.append(f"Bill Title: \"{short_title}\".")
        if monies:
            takeaways.append(
                f"Appropriations: Identified funding amounts of {', '.join(monies[:3])}."
            )
        if effective_dates:
            takeaways.append(
                f"Effective Dates: Key operative dates include {'; '.join(effective_dates[:2])}."
            )
        elif dates:
            takeaways.append(f"Dates Referenced: {', '.join(dates[:2])}.")
        if section_count > 0:
            takeaways.append(
                f"Document Structure: {structure_str} covering distinct legislative provisions."
            )
        if reporting_matches:
            takeaways.append(
                "Compliance: Contains mandatory reporting or agency action requirements."
            )

        if not takeaways:
            takeaways = [
                "Legislative bill with no monetary appropriations identified.",
                "Review full text for agency mandates and implementation timelines.",
                "Consult the official enrolled bill for effective date and compliance deadlines.",
            ]

        # ── Apply Model Guardrails (PRD Section 7.2) ─────────────────────────
        sanitized_summary = ModelGuardrails.sanitize_text(raw_summary)
        sanitized_takeaways = ModelGuardrails.sanitize_takeaways(takeaways[:5])

        token_count = len(sanitized_summary.split()) + sum(
            len(t.split()) for t in sanitized_takeaways
        )

        return sanitized_summary, sanitized_takeaways, token_count
