import io
import pytest
from bson import ObjectId
from app.db import Database
from app.services.clause_extractor import deduplicate_clauses, ClauseExtractor
from app.services.ner_service import EntityExtractor
from app.services.analyzer_pipeline import AnalyzerPipeline, InferenceTimeoutError
from app.services.pdf_exporter import generate_pdf_report
from app.routes.documents import serialize_doc

def test_deduplicate_clauses_iou():
    """Verify IoU overlap thresholding keeps highest confidence clause and sorts by start_char."""
    clauses = [
        {
            "category": "Indemnity",
            "start_char": 100,
            "end_char": 200,
            "confidence_score": 0.75,
            "clause_text": "Clause A"
        },
        {
            "category": "Indemnity",
            "start_char": 110,
            "end_char": 205,
            "confidence_score": 0.95,
            "clause_text": "Clause B higher conf"
        },
        {
            "category": "Limitation of Liability",
            "start_char": 105,
            "end_char": 195,
            "confidence_score": 0.80,
            "clause_text": "Different category"
        },
        {
            "category": "Indemnity",
            "start_char": 50,
            "end_char": 80,
            "confidence_score": 0.85,
            "clause_text": "Distinct clause earlier"
        }
    ]

    deduped = deduplicate_clauses(clauses, iou_threshold=0.5)

    # Clause A and Clause B have IoU > 0.5 with same category "Indemnity". Clause B has higher conf (0.95 vs 0.75).
    # "Different category" is preserved despite overlapping span.
    # "Distinct clause earlier" is preserved.
    assert len(deduped) == 3

    # Verify sorted by start_char
    assert [c["start_char"] for c in deduped] == [50, 105, 110]

    # Verify Clause B was kept over Clause A
    indemnity_at_110 = next(c for c in deduped if c["category"] == "Indemnity" and c["start_char"] == 110)
    assert indemnity_at_110["confidence_score"] == 0.95
    assert indemnity_at_110["clause_text"] == "Clause B higher conf"


def test_confidence_scores_omitted():
    """Verify confidence scores are omitted from extracted entities and clauses."""
    sample_text = (
        "This Agreement is between Acme Global Inc. and Beta Systems LLC. "
        "The total compensation is $50,000 USD payable on October 15, 2026. "
        "Governed by the laws of the State of Delaware. "
        "Each party agrees to indemnify and hold harmless the other party against all claims."
    )
    entities = EntityExtractor.extract_entities(sample_text)
    assert len(entities) > 0

    for e in entities:
        assert "confidence_score" not in e

    clauses = ClauseExtractor.extract_clauses(sample_text)
    assert len(clauses) > 0
    for c in clauses:
        assert "confidence_score" not in c


def test_spacy_mode_surfacing():
    """Verify extraction mode (full or reduced) is reported properly."""
    mode = EntityExtractor.get_extraction_mode()
    assert mode in ("full", "reduced")


def test_document_pagination_and_meta(client, auth_headers):
    """Verify pagination query parameters (page, limit) and returned metadata."""
    db = Database.db
    # Find user_id from token
    user = db.users.find_one({"email": "testuser@example.com"})
    user_id = user["_id"]

    # Insert 5 test documents
    for i in range(1, 6):
        db.documents.insert_one({
            "user_id": user_id,
            "filename": f"contract_{i}.pdf",
            "file_type": "application/pdf",
            "file_size_bytes": 1000 * i,
            "page_count": i,
            "status": "COMPLETED",
            "full_text": f"Contract content {i}"
        })

    # Request page 1 with limit 2
    res = client.get("/api/documents?page=1&limit=2", headers=auth_headers)
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    assert len(json_data["data"]["documents"]) == 2
    assert "meta" in json_data["data"]
    meta = json_data["data"]["meta"]
    assert meta["total"] == 5
    assert meta["page"] == 1
    assert meta["limit"] == 2
    assert meta["total_pages"] == 3

    # Request page 3 with limit 2
    res3 = client.get("/api/documents?page=3&limit=2", headers=auth_headers)
    assert res3.status_code == 200
    json_data3 = res3.get_json()
    assert len(json_data3["data"]["documents"]) == 1


def test_reanalyze_full_text_fallback(client, auth_headers):
    """Verify reanalyze pulls full_text from documents collection when body text is missing."""
    db = Database.db
    user = db.users.find_one({"email": "testuser@example.com"})
    user_id = user["_id"]

    doc_id = db.documents.insert_one({
        "user_id": user_id,
        "filename": "reanalyze_test.pdf",
        "file_type": "application/pdf",
        "file_size_bytes": 5000,
        "page_count": 1,
        "status": "COMPLETED",
        "full_text": (
            "MASTER CONSULTING SERVICES AGREEMENT\n\n"
            "This Agreement is by and between Alpha Corp and Beta LLC.\n"
            "1. INDEMNITY: Contractor shall defend and indemnify Client.\n"
            "2. FEES: Client shall pay $15,000 USD monthly.\n"
            "3. GOVERNING LAW: State of New York."
        )
    }).inserted_id

    # Call reanalyze with empty body {}
    res = client.post(
        f"/api/documents/{str(doc_id)}/analyze",
        json={},
        headers=auth_headers
    )
    assert res.status_code == 200
    res_json = res.get_json()
    assert res_json["success"] is True
    assert res_json["data"]["status"] == "COMPLETED"
    assert len(res_json["data"]["clauses"]) >= 1


def test_clause_description_persistence_and_cascading_delete(client, auth_headers):
    """Verify clause description is persisted in DB, returned in details, and cascading delete purges all collections."""
    db = Database.db
    user = db.users.find_one({"email": "testuser@example.com"})
    user_id = user["_id"]

    sample_contract = (
        "MASTER SERVICES AGREEMENT\n\n"
        "This Agreement is entered into by and between Tech Co and Agency Inc.\n"
        "1. Indemnity: Contractor shall indemnify and hold harmless Client from any claims.\n"
        "2. Governing Law: This contract is governed by the laws of the State of California.\n"
        "3. Payment: $20,000 USD."
    )

    doc_id = db.documents.insert_one({
        "user_id": user_id,
        "filename": "cascading_test.pdf",
        "file_type": "application/pdf",
        "file_size_bytes": 4000,
        "page_count": 1,
        "status": "COMPLETED",
        "full_text": sample_contract
    }).inserted_id

    # Run analysis pipeline directly
    result = AnalyzerPipeline.run_analysis(str(doc_id), str(user_id), sample_contract)
    assert result["status"] == "COMPLETED"

    # Check MongoDB extracted_clauses collection has description
    clause_record = db.extracted_clauses.find_one({"document_id": doc_id})
    assert clause_record is not None
    assert "description" in clause_record
    assert len(clause_record["description"]) > 0

    # Check GET document details returns description
    details_res = client.get(f"/api/documents/{str(doc_id)}", headers=auth_headers)
    assert details_res.status_code == 200
    clauses_in_res = details_res.get_json()["data"]["clauses"]
    assert any("description" in c and c["description"] for c in clauses_in_res)

    # Perform cascading delete
    del_res = client.delete(f"/api/documents/{str(doc_id)}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify all associated collections are empty for this document_id
    assert db.documents.find_one({"_id": doc_id}) is None
    assert db.summaries.find_one({"document_id": doc_id}) is None
    assert db.extracted_clauses.find_one({"document_id": doc_id}) is None
    assert db.extracted_entities.find_one({"document_id": doc_id}) is None


def test_pdf_export_endpoint(client, auth_headers):
    """Verify GET /api/documents/<id>/export generates and streams a valid PDF."""
    db = Database.db
    user = db.users.find_one({"email": "testuser@example.com"})
    user_id = user["_id"]

    sample_contract = (
        "SOFTWARE LICENSE AGREEMENT\n\n"
        "Between Licensor and Licensee.\n"
        "Section 1. Indemnification: Licensor shall indemnify Licensee against copyright infringement.\n"
        "Section 2. Governing Law: State of Delaware.\n"
        "Section 3. Price: $8,000 USD."
    )

    doc_id = db.documents.insert_one({
        "user_id": user_id,
        "filename": "export_test.pdf",
        "file_type": "application/pdf",
        "file_size_bytes": 3500,
        "page_count": 1,
        "status": "COMPLETED",
        "full_text": sample_contract
    }).inserted_id

    # Populate summary, clauses, entities
    AnalyzerPipeline.run_analysis(str(doc_id), str(user_id), sample_contract)

    # Test PDF export route
    res = client.get(f"/api/documents/{str(doc_id)}/export", headers=auth_headers)
    assert res.status_code == 200
    assert "application/pdf" in res.content_type
    assert len(res.data) > 100
    # PDF starts with %PDF header
    assert res.data[:4] == b"%PDF"


def test_inference_timeout_handling(app, monkeypatch):
    """Verify timeout aborts gracefully and marks document as FAILED."""
    db = Database.db
    user_id = ObjectId()
    timeout_contract = (
        "MASTER SERVICES AGREEMENT\n\n"
        "This Agreement is entered into by and between Tech Co and Agency Inc.\n"
        "1. Indemnity: Contractor shall indemnify and hold harmless Client from any claims.\n"
        "2. Governing Law: This contract is governed by the laws of the State of California."
    )
    doc_id = db.documents.insert_one({
        "user_id": user_id,
        "filename": "timeout_test.pdf",
        "status": "PENDING",
        "full_text": timeout_contract
    }).inserted_id

    # Mock time.sleep inside ClauseExtractor.extract_clauses to simulate hung inference
    import time
    def mock_extract(*args, **kwargs):
        time.sleep(2)
        return []

    monkeypatch.setattr(ClauseExtractor, "extract_clauses", mock_extract)

    # Run analysis with timeout of 1 second
    with pytest.raises(InferenceTimeoutError):
        AnalyzerPipeline.run_analysis(str(doc_id), str(user_id), timeout_contract, timeout_seconds=1)

    updated_doc = db.documents.find_one({"_id": doc_id})
    assert updated_doc["status"] == "FAILED"
    assert "timed out" in updated_doc["error_message"].lower()

