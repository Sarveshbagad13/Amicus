import pytest
from bson import ObjectId
from datetime import datetime, timezone
from app.db import Database

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert "legal_disclaimer" in data["data"]["compliance"]

def test_user_registration_success(client):
    res = client.post("/api/auth/register", json={
        "email": "freelancer@example.com",
        "password": "SecurePassword123!",
        "full_name": "Freelancer Jane"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "freelancer@example.com"
    assert data["data"]["user"]["full_name"] == "Freelancer Jane"
    assert "token" in data["data"]
    assert "password_hash" not in data["data"]["user"]

def test_user_registration_duplicate_email(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "SecurePassword123!",
        "full_name": "User One"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    data = res2.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "USER_ALREADY_EXISTS"

def test_user_registration_validation_errors(client):
    # Invalid email
    res1 = client.post("/api/auth/register", json={
        "email": "not-an-email",
        "password": "Password123!",
        "full_name": "Invalid Email"
    })
    assert res1.status_code == 400
    assert res1.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # Short password
    res2 = client.post("/api/auth/register", json={
        "email": "valid@example.com",
        "password": "short",
        "full_name": "Short Password"
    })
    assert res2.status_code == 400
    assert res2.get_json()["error"]["code"] == "VALIDATION_ERROR"

def test_user_login_success(client):
    # Register
    client.post("/api/auth/register", json={
        "email": "loginuser@example.com",
        "password": "Password123!",
        "full_name": "Login User"
    })
    
    # Login
    res = client.post("/api/auth/login", json={
        "email": "loginuser@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "loginuser@example.com"

def test_user_login_invalid_credentials(client):
    res = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "WrongPassword123!"
    })
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "INVALID_CREDENTIALS"

def test_get_current_user_profile(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "testuser@example.com"

def test_get_current_user_unauthorized(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "AUTH_HEADER_MISSING"

def test_documents_list_and_detail(client, auth_headers):
    # Get user profile
    me_res = client.get("/api/auth/me", headers=auth_headers)
    user_id = ObjectId(me_res.get_json()["data"]["user"]["id"])

    # Insert test document directly into mock DB
    docs_col = Database.get_documents_collection()
    summaries_col = Database.get_summaries_collection()
    clauses_col = Database.get_clauses_collection()
    entities_col = Database.get_entities_collection()

    doc_id = docs_col.insert_one({
        "user_id": user_id,
        "filename": "Freelance_Agreement.pdf",
        "file_type": "application/pdf",
        "file_size_bytes": 524288,
        "page_count": 5,
        "raw_text_length": 15000,
        "status": "COMPLETED",
        "error_message": None,
        "created_at": datetime.now(timezone.utc)
    }).inserted_id

    summaries_col.insert_one({
        "document_id": doc_id,
        "user_id": user_id,
        "model_name": "bart-legal-contract-v1",
        "summary_text": "This contract specifies freelance web design services...",
        "key_takeaways": ["Net-15 payment terms", "No non-compete clause"],
        "token_count": 210,
        "created_at": datetime.now(timezone.utc)
    })

    clauses_col.insert_one({
        "document_id": doc_id,
        "user_id": user_id,
        "category": "Indemnity",
        "clause_text": "Freelancer agrees to indemnify Client...",
        "start_char": 100,
        "end_char": 250,
        "page_number": 2,
        "created_at": datetime.now(timezone.utc)
    })

    entities_col.insert_one({
        "document_id": doc_id,
        "user_id": user_id,
        "entity_type": "MONEY",
        "text": "$5,000",
        "context": "Total contract fee of $5,000",
        "created_at": datetime.now(timezone.utc)
    })

    # Test list endpoint
    list_res = client.get("/api/documents", headers=auth_headers)
    assert list_res.status_code == 200
    docs = list_res.get_json()["data"]["documents"]
    assert len(docs) == 1
    assert docs[0]["filename"] == "Freelance_Agreement.pdf"
    assert "Net-15" not in docs[0]["summary_snippet"] or "freelance" in docs[0]["summary_snippet"]
    assert docs[0]["key_takeaways_count"] == 2

    # Test get document details
    detail_res = client.get(f"/api/documents/{str(doc_id)}", headers=auth_headers)
    assert detail_res.status_code == 200
    data = detail_res.get_json()["data"]
    assert data["document"]["filename"] == "Freelance_Agreement.pdf"
    assert data["summary"]["model_name"] == "bart-legal-contract-v1"
    assert len(data["clauses"]) == 1
    assert data["clauses"][0]["category"] == "Indemnity"
    assert len(data["entities"]) == 1
    assert data["entities"][0]["entity_type"] == "MONEY"

def test_document_cascading_deletion(client, auth_headers):
    me_res = client.get("/api/auth/me", headers=auth_headers)
    user_id = ObjectId(me_res.get_json()["data"]["user"]["id"])

    docs_col = Database.get_documents_collection()
    summaries_col = Database.get_summaries_collection()
    clauses_col = Database.get_clauses_collection()
    entities_col = Database.get_entities_collection()

    doc_id = docs_col.insert_one({
        "user_id": user_id,
        "filename": "To_Delete.pdf",
        "file_type": "application/pdf",
        "file_size_bytes": 1000,
        "page_count": 1,
        "raw_text_length": 500,
        "status": "COMPLETED",
        "error_message": None,
        "created_at": datetime.now(timezone.utc)
    }).inserted_id

    summaries_col.insert_one({
        "document_id": doc_id,
        "user_id": user_id,
        "model_name": "bart-legal-contract-v1",
        "summary_text": "Summary...",
        "key_takeaways": [],
        "token_count": 10,
        "created_at": datetime.now(timezone.utc)
    })

    clauses_col.insert_one({
        "document_id": doc_id,
        "user_id": user_id,
        "category": "Termination",
        "clause_text": "Termination clause...",
        "start_char": 0,
        "end_char": 50,
        "page_number": 1,
        "created_at": datetime.now(timezone.utc)
    })

    entities_col.insert_one({
        "document_id": doc_id,
        "user_id": user_id,
        "entity_type": "DATE",
        "text": "August 25, 2026",
        "context": "Dated August 25, 2026",
        "created_at": datetime.now(timezone.utc)
    })

    # Perform DELETE
    del_res = client.delete(f"/api/documents/{str(doc_id)}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.get_json()["success"] is True

    # Verify hard deletion across all collections
    assert docs_col.find_one({"_id": doc_id}) is None
    assert summaries_col.find_one({"document_id": doc_id}) is None
    assert clauses_col.find_one({"document_id": doc_id}) is None
    assert entities_col.find_one({"document_id": doc_id}) is None
