import io
import fitz  # PyMuPDF
import docx
import pytest
from app.services.document_parser import (
    DocumentParser,
    ScannedDocumentError,
    UnsupportedLanguageError,
    UnsupportedFormatError,
    CorruptedFileError
)
from app.services.chunker import DocumentChunker

def create_sample_pdf(text: str, num_pages: int = 1) -> bytes:
    """Helper to generate a real in-memory PDF using PyMuPDF."""
    doc = fitz.open()
    for _ in range(num_pages):
        page = doc.new_page()
        # insert text at point (50, 72)
        page.insert_text(fitz.Point(50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def create_sample_docx(text: str) -> bytes:
    """Helper to generate a real in-memory DOCX using python-docx."""
    doc = docx.Document()
    for p in text.split("\n\n"):
        if p.strip():
            doc.add_paragraph(p.strip())
    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()

def test_parse_valid_pdf():
    contract_text = (
        "CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT\n\n"
        "This Agreement is entered into by and between Acme Corp and Beta LLC.\n"
        "1. Confidential Information: Each party agrees to protect proprietary data.\n"
        "2. Governing Law: This agreement shall be governed by the laws of the State of Delaware.\n"
        "3. Term and Termination: Either party may terminate with 30 days written notice."
    )
    pdf_bytes = create_sample_pdf(contract_text, num_pages=2)
    parsed = DocumentParser.parse(pdf_bytes, "nda_contract.pdf")

    assert parsed["filename"] == "nda_contract.pdf"
    assert parsed["file_type"] == "application/pdf"
    assert parsed["page_count"] == 2
    assert "Acme Corp" in parsed["full_text"]
    assert len(parsed["pages"]) == 2

def test_parse_valid_docx():
    contract_text = (
        "MASTER SERVICES AGREEMENT\n\n"
        "This Master Services Agreement is made between Alpha Solutions and Omega Services.\n\n"
        "Section 1. Indemnification: Alpha shall indemnify and hold harmless Omega from all claims.\n\n"
        "Section 2. Payment Terms: Invoices are payable net-30 days from receipt."
    )
    docx_bytes = create_sample_docx(contract_text)
    parsed = DocumentParser.parse(docx_bytes, "msa_contract.docx")

    assert parsed["filename"] == "msa_contract.docx"
    assert parsed["file_type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert "Alpha Solutions" in parsed["full_text"]
    assert parsed["raw_text_length"] > 100

def test_scanned_pdf_rejection():
    # PDF with no text (representing scanned image without OCR)
    empty_pdf = create_sample_pdf("", num_pages=1)
    with pytest.raises(ScannedDocumentError) as exc_info:
        DocumentParser.parse(empty_pdf, "scanned_invoice.pdf")
    
    assert "scanned images without a selectable text layer" in str(exc_info.value)

def test_non_english_document_rejection():
    french_text = (
        "CONTRAT DE PRESTATION DE SERVICES\n\n"
        "Le présent contrat est conclu entre la société Dupont SAS et la société Martin SARL.\n"
        "Article 1. Objet du contrat: Le prestataire s'engage à fournir les services suivants.\n"
        "Article 2. Rémunération: Le client versera une rémunération forfaitaire mensuelle.\n"
        "Article 3. Loi applicable: Le présent contrat est soumis au droit français et aux tribunaux de Paris."
    )
    french_pdf = create_sample_pdf(french_text, num_pages=1)
    with pytest.raises(UnsupportedLanguageError) as exc_info:
        DocumentParser.parse(french_pdf, "french_contract.pdf")
    
    assert "Phase 1 only supports English-language contracts" in str(exc_info.value)

def test_unsupported_file_extension():
    with pytest.raises(UnsupportedFormatError) as exc_info:
        DocumentParser.parse(b"some raw text data", "contract.txt")
    assert "Unsupported file format" in str(exc_info.value)

def test_corrupted_file():
    with pytest.raises(CorruptedFileError):
        DocumentParser.parse(b"NOT_A_VALID_PDF_OR_DOCX_HEADER", "corrupted.pdf")

def test_document_chunker():
    long_contract = "\n\n".join([
        f"SECTION {i}. Clause regarding obligation number {i}. " +
        "The contractor shall perform all duties diligently according to industry standards. " * 15
        for i in range(1, 10)
    ])
    chunks = DocumentChunker.chunk_text(long_contract, max_words_per_chunk=100, overlap_words=20)
    assert len(chunks) > 1
    for chunk in chunks:
        assert chunk["start_char"] < chunk["end_char"]
        assert len(chunk["text"]) > 0
        assert "chunk_index" in chunk

def test_upload_endpoint_integration(client, auth_headers):
    contract_text = (
        "CONSULTING SERVICES AGREEMENT\n\n"
        "Between TechCorp and Consultant Jane.\n"
        "Section 1. Indemnity: Consultant will indemnify TechCorp.\n"
        "Section 2. Governing Law: State of New York.\n"
        "Section 3. Payment: $10,000 USD per month."
    )
    pdf_bytes = create_sample_pdf(contract_text, num_pages=1)

    data = {
        "file": (io.BytesIO(pdf_bytes), "valid_contract.pdf")
    }
    res = client.post(
        "/api/documents/upload",
        data=data,
        content_type="multipart/form-data",
        headers=auth_headers
    )
    assert res.status_code == 201
    res_json = res.get_json()
    assert res_json["success"] is True
    assert res_json["data"]["document"]["filename"] == "valid_contract.pdf"
    assert res_json["data"]["document"]["status"] in ("PENDING", "COMPLETED")
    assert res_json["data"]["pages_count"] == 1
    assert "TechCorp" in res_json["data"]["full_text"]
    assert len(res_json["data"]["chunks"]) >= 1

def test_upload_scanned_pdf_endpoint(client, auth_headers):
    empty_pdf = create_sample_pdf("", num_pages=1)
    data = {
        "file": (io.BytesIO(empty_pdf), "scanned.pdf")
    }
    res = client.post(
        "/api/documents/upload",
        data=data,
        content_type="multipart/form-data",
        headers=auth_headers
    )
    assert res.status_code == 422
    res_json = res.get_json()
    assert res_json["success"] is False
    assert res_json["error"]["code"] == "SCANNED_DOCUMENT_REJECTED"
    assert "scanned images without a selectable text layer" in res_json["error"]["message"]
