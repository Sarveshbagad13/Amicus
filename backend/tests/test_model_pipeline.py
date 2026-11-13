import pytest
import io
import fitz
from app.services.guardrails import ModelGuardrails
from app.services.clause_extractor import ClauseExtractor
from app.services.summarizer import ContractSummarizer
from app.services.ner_service import EntityExtractor
from app.services.analyzer_pipeline import AnalyzerPipeline
from app.db import Database

SAMPLE_CONTRACT = (
    "MASTER SERVICES AND INDEPENDENT CONTRACTOR AGREEMENT\n\n"
    "This Agreement is entered into by and between Global Tech Solutions Inc. and Alex Rivera Consulting LLC, "
    "effective as of September 15, 2026.\n\n"
    "1. Scope of Work & Deliverables:\n"
    "Contractor will provide software engineering services as defined in attached Statements of Work.\n\n"
    "2. Compensation and Payment Terms:\n"
    "Client shall pay Contractor a monthly fee of $12,500 USD. Invoices are payable net-30 days from receipt. "
    "A late payment fee of 1.5% per month will apply to overdue balances.\n\n"
    "3. Term and Automatic Renewal:\n"
    "This Agreement will commence on the Effective Date and remain in effect for one (1) year. "
    "Thereafter, this Agreement shall automatically renew for successive one-year terms unless either party "
    "provides written notice of non-renewal at least 60 days prior to expiration.\n\n"
    "4. Termination for Convenience and Cause:\n"
    "Either party may terminate this Agreement for convenience upon 30 days written notice of termination. "
    "Either party may terminate immediately for material breach if the breaching party fails to cure within 15 days.\n\n"
    "5. Indemnification:\n"
    "Contractor shall defend, indemnify, and hold harmless Client and its officers against all third-party claims, "
    "losses, and liabilities arising out of Contractor's gross negligence or willful misconduct.\n\n"
    "6. Limitation of Liability:\n"
    "In no event shall either party be liable for consequential damages or lost profits. "
    "The total aggregate liability of either party shall not exceed the total fees paid in the preceding six months.\n\n"
    "7. Confidential Information:\n"
    "Each party agrees that all proprietary information received shall be maintained in strict confidence and "
    "shall not be disclosed to third parties without prior written consent.\n\n"
    "8. Governing Law and Dispute Resolution:\n"
    "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware."
)

def test_model_guardrails_sanitization():
    unsafe_text = (
        "This contract is legally binding in court. "
        "You will win if sued under Section 5. "
        "I advise you to delete the indemnity clause immediately."
    )
    sanitized = ModelGuardrails.sanitize_text(unsafe_text)
    assert "legally binding" not in sanitized
    assert "You will win" not in sanitized
    assert "I advise you to" not in sanitized
    assert "The document contains provisions regarding" in sanitized

def test_clause_extractor_primary_categories():
    clauses = ClauseExtractor.extract_clauses(SAMPLE_CONTRACT)
    categories = [c["category"] for c in clauses]

    assert "Indemnity" in categories
    assert "Termination" in categories
    assert "Auto-Renewal" in categories
    assert "Confidentiality" in categories
    assert "Governing Law" in categories
    assert "Limitation of Liability" in categories
    assert "Payment Terms" in categories

    for c in clauses:
        assert "confidence_score" not in c
        assert c["start_char"] < c["end_char"]
        assert c["page_number"] >= 1
        assert len(c["clause_text"]) > 20

def test_clause_extractor_zero_categories():
    non_contract_text = "The quick brown fox jumps over the lazy dog. Today is a sunny day in the park."
    clauses = ClauseExtractor.extract_clauses(non_contract_text)
    assert len(clauses) == 0

def test_entity_extractor():
    entities = EntityExtractor.extract_entities(SAMPLE_CONTRACT)
    types = [e["entity_type"] for e in entities]
    texts = [e["text"] for e in entities]

    assert "PARTY" in types
    assert "DATE" in types
    assert "MONEY" in types
    assert "GOVERNING_LAW" in types

    assert any("$12,500" in t for t in texts)
    assert any("September 15, 2026" in t for t in texts)
    assert any("Delaware" in t for t in texts)

def test_contract_summarizer():
    clauses = ClauseExtractor.extract_clauses(SAMPLE_CONTRACT)
    entities = EntityExtractor.extract_entities(SAMPLE_CONTRACT)
    summary_text, takeaways, token_count = ContractSummarizer.generate_summary(
        SAMPLE_CONTRACT,
        extracted_clauses=clauses,
        extracted_entities=entities
    )

    assert len(summary_text) > 200
    assert "Delaware" in summary_text or "jurisdiction" in summary_text
    assert len(takeaways) >= 3
    assert token_count > 50

def test_analyzer_pipeline_orchestration(app):
    with app.app_context():
        # Create user & document in mock DB
        user_id = Database.get_users_collection().insert_one({
            "email": "pipeline@example.com",
            "full_name": "Pipeline User"
        }).inserted_id

        doc_id = Database.get_documents_collection().insert_one({
            "user_id": user_id,
            "filename": "Sample_Contract.pdf",
            "status": "PENDING"
        }).inserted_id

        result = AnalyzerPipeline.run_analysis(
            document_id=str(doc_id),
            user_id=str(user_id),
            full_text=SAMPLE_CONTRACT
        )

        assert result["document"]["status"] == "COMPLETED"
        assert result["summary"]["summary_text"] is not None
        assert len(result["clauses"]) >= 5
        assert len(result["entities"]) >= 3
        assert result["compliance"]["is_legal_advice"] is False


# ──────────────────────────────────────────────────────────────────────────────
# New tests: document-type routing bug fix
# ──────────────────────────────────────────────────────────────────────────────

from app.services.document_classifier import detect_document_type
from app.services.summarizer import BillSummarizer

# Minimal but realistic legislative bill preamble
SAMPLE_BILL_BROADBAND = (
    "117th CONGRESS\n"
    "1st Session\n\n"
    "IN THE SENATE OF THE UNITED STATES\n\n"
    "A BILL\n\n"
    "AN ACT to promote rural broadband infrastructure deployment and ensure "
    "universal access to high-speed internet connectivity.\n\n"
    "Be it enacted by the Senate and House of Representatives of the United States "
    "of America in Congress assembled,\n\n"
    "SHORT TITLE.—This Act may be cited as the \"Broadband Connectivity and Rural "
    "Access Act of 2024\".\n\n"
    "SECTION 1. FINDINGS AND PURPOSE.\n"
    "Congress finds that high-speed internet access is essential for economic "
    "opportunity, health care, education, and civic participation.\n\n"
    "SECTION 2. GRANT PROGRAM.\n"
    "There is hereby appropriated to the Secretary of Agriculture $65,000,000,000 "
    "to carry out a broadband deployment grant program for eligible rural areas. "
    "Grants shall not exceed $50,000,000 per applicant per fiscal year.\n\n"
    "SECTION 3. REPORTING REQUIREMENTS.\n"
    "The Secretary shall submit a report to Congress within 180 days of enactment "
    "on the use of funds provided under Section 2. "
    "Annual reports shall thereafter be submitted no later than January 31 of each year.\n\n"
    "SECTION 4. EFFECTIVE DATE.\n"
    "This Act shall take effect on October 1, 2024.\n"
)

# Second distinct bill — different subject (wetlands / Clean Water Act)
SAMPLE_BILL_WETLANDS = (
    "116th CONGRESS\n"
    "2d Session\n\n"
    "IN THE HOUSE OF REPRESENTATIVES\n\n"
    "AN ACT to amend the Federal Water Pollution Control Act to restore and protect "
    "critical wetland ecosystems across the continental United States.\n\n"
    "Be it enacted by the Senate and House of Representatives of the United States "
    "of America in Congress assembled,\n\n"
    "SHORT TITLE.—This Act may be cited as the \"Wetlands Conservation and Clean Water "
    "Restoration Act of 2023\".\n\n"
    "SECTION 1. WETLANDS CONSERVATION FUND.\n"
    "There is hereby appropriated $8,500,000,000 to establish the Wetlands Conservation "
    "Fund under the direction of the Administrator of the Environmental Protection Agency. "
    "No single State may receive more than $750,000,000 in any fiscal year.\n\n"
    "SECTION 2. PROHIBITED DISCHARGES.\n"
    "The Administrator shall, within 90 days of enactment, promulgate regulations "
    "prohibiting the discharge of pollutants into protected wetland zones identified "
    "under Appendix A of this Act.\n\n"
    "SECTION 3. ANNUAL REPORTING.\n"
    "The Administrator shall submit an annual report to Congress on wetland acreage "
    "restoration progress no later than March 1 of each fiscal year.\n\n"
    "SECTION 4. EFFECTIVE DATE.\n"
    "This Act takes effect 60 days after the date of enactment.\n"
)


def test_document_type_detection_bill():
    """Bills containing 'AN ACT' and 'Be it enacted by' must be classified as BILL."""
    assert detect_document_type(SAMPLE_BILL_BROADBAND) == "BILL"
    assert detect_document_type(SAMPLE_BILL_WETLANDS) == "BILL"


def test_document_type_detection_contract():
    """Standard commercial contracts must still be classified as CONTRACT."""
    assert detect_document_type(SAMPLE_CONTRACT) == "CONTRACT"


def test_bill_summarizer_routes_correctly(app):
    """Pipeline fed a bill must use BillSummarizer and record model_name as 'billsum-template-v1'."""
    with app.app_context():
        user_id = Database.get_users_collection().insert_one({
            "email": "bill_route@example.com",
            "full_name": "Bill Route User"
        }).inserted_id

        doc_id = Database.get_documents_collection().insert_one({
            "user_id": user_id,
            "filename": "Broadband_Act.pdf",
            "status": "PENDING"
        }).inserted_id

        result = AnalyzerPipeline.run_analysis(
            document_id=str(doc_id),
            user_id=str(user_id),
            full_text=SAMPLE_BILL_BROADBAND,
        )

        assert result["document"]["status"] == "COMPLETED"
        # Model label must reflect the bill summarizer, not the contract default
        assert result["summary"]["model_name"] == "billsum-template-v1"
        assert result["summary"]["doc_type"] == "BILL"
        # Bills produce zero CUAD clause matches — clause list must be empty
        assert result["clauses"] == []
        # Summary must be non-trivial
        assert len(result["summary"]["summary_text"]) > 100


def test_contract_summarizer_regression(app):
    """Regression: pipeline fed a contract must NOT route to BillSummarizer."""
    with app.app_context():
        user_id = Database.get_users_collection().insert_one({
            "email": "contract_regression@example.com",
            "full_name": "Regression User"
        }).inserted_id

        doc_id = Database.get_documents_collection().insert_one({
            "user_id": user_id,
            "filename": "Sample_Contract.pdf",
            "status": "PENDING"
        }).inserted_id

        result = AnalyzerPipeline.run_analysis(
            document_id=str(doc_id),
            user_id=str(user_id),
            full_text=SAMPLE_CONTRACT,
        )

        assert result["document"]["status"] == "COMPLETED"
        # Must NOT use the bill model label
        assert result["summary"]["model_name"] != "billsum-template-v1"
        assert result["summary"]["doc_type"] == "CONTRACT"
        # Contracts must still extract CUAD clauses
        assert len(result["clauses"]) >= 5


def test_bill_summaries_differ_by_content():
    """
    Two bills on different subjects must produce substantively different summaries.
    This directly validates that the boilerplate-fallback bug (identical generic
    commercial-agreement text regardless of bill content) does not recur.
    """
    from app.services.ner_service import EntityExtractor

    entities_broadband = EntityExtractor.extract_entities(SAMPLE_BILL_BROADBAND)
    entities_wetlands = EntityExtractor.extract_entities(SAMPLE_BILL_WETLANDS)

    summary_bb, takeaways_bb, _ = BillSummarizer.generate_summary(
        SAMPLE_BILL_BROADBAND, extracted_entities=entities_broadband
    )
    summary_wl, takeaways_wl, _ = BillSummarizer.generate_summary(
        SAMPLE_BILL_WETLANDS, extracted_entities=entities_wetlands
    )

    # Summaries must be non-empty and distinct
    assert len(summary_bb) > 100
    assert len(summary_wl) > 100
    assert summary_bb != summary_wl

    # Each summary must reflect the bill's specific subject matter.
    # BillSummarizer embeds appropriation amounts directly — use those as
    # the subject-differentiation signal (each bill has distinct dollar figures).
    assert "65,000,000,000" in summary_bb, "Broadband bill appropriation must appear in its summary"
    assert "8,500,000,000" in summary_wl, "Wetlands bill appropriation must appear in its summary"

    # Takeaways must also differ
    joined_bb = " ".join(takeaways_bb)
    joined_wl = " ".join(takeaways_wl)
    assert joined_bb != joined_wl

    # Neither summary should contain contract-specific boilerplate phrases
    contract_boilerplate_phrases = [
        "Standard confidentiality and limitation of liability provisions",
        "Invoices are subject to agreed delivery acceptance",
        "Standard commercial terms established between parties",
        "Review notice windows for termination",
    ]
    for phrase in contract_boilerplate_phrases:
        assert phrase not in summary_bb, f"Contract boilerplate found in bill summary: '{phrase}'"
        assert phrase not in summary_wl, f"Contract boilerplate found in bill summary: '{phrase}'"
