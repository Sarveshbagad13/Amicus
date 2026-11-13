import math
from fastapi import APIRouter, Request, Depends, UploadFile, File, Response
from bson import ObjectId
from datetime import datetime, timezone
from app.db import Database, serialize_doc
from app.middleware import get_current_user
from app.utils.responses import success_response, error_response
from app.services.document_parser import (
    DocumentParser,
    UnsupportedFormatError,
    ScannedDocumentError,
    UnsupportedLanguageError,
    CorruptedFileError
)
from app.services.chunker import DocumentChunker

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload and parse a legal document (PDF or DOCX), validating all PRD constraints."""
    if file is None or not file.filename:
        # Check if form data contains file
        form = await request.form()
        if "file" in form and hasattr(form["file"], "filename"):
            file = form["file"]

    if file is None or not hasattr(file, "filename") or not file.filename:
        return error_response(
            message="No file part in the request.",
            error_code="MISSING_FILE",
            status_code=400
        )

    filename = file.filename
    if filename == "":
        return error_response(
            message="No file selected for upload.",
            error_code="EMPTY_FILENAME",
            status_code=400
        )

    try:
        if hasattr(file, "read"):
            res = file.read()
            if hasattr(res, "__await__"):
                file_bytes = await res
            else:
                file_bytes = res
        else:
            file_bytes = b""
        parsed_doc = DocumentParser.parse(file_bytes, filename)

    except UnsupportedFormatError as e:
        return error_response(
            message=str(e),
            error_code="UNSUPPORTED_FORMAT",
            status_code=400
        )
    except UnsupportedLanguageError as e:
        return error_response(
            message=str(e),
            error_code="UNSUPPORTED_LANGUAGE",
            status_code=400
        )
    except ScannedDocumentError as e:
        return error_response(
            message=str(e),
            error_code="SCANNED_DOCUMENT_REJECTED",
            status_code=422
        )
    except CorruptedFileError as e:
        return error_response(
            message=str(e),
            error_code="CORRUPTED_FILE",
            status_code=422
        )
    except Exception as e:
        return error_response(
            message="Failed to parse document content.",
            error_code="PARSING_FAILED",
            status_code=500,
            details=str(e)
        )

    # Chunk the text for token management
    chunks = DocumentChunker.chunk_text(parsed_doc["full_text"])

    user_id = current_user["id"]
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        user_obj_id = user_id

    doc_record = {
        "user_id": user_obj_id,
        "filename": parsed_doc["filename"],
        "file_type": parsed_doc["file_type"],
        "file_size_bytes": parsed_doc["file_size_bytes"],
        "page_count": parsed_doc["page_count"],
        "raw_text_length": parsed_doc["raw_text_length"],
        "full_text": parsed_doc["full_text"],
        "status": "PENDING",
        "error_message": None,
        "created_at": datetime.now(timezone.utc)
    }

    docs_col = Database.get_documents_collection()
    insert_result = docs_col.insert_one(doc_record)
    doc_id_str = str(insert_result.inserted_id)
    doc_record["_id"] = insert_result.inserted_id

    # Automatically trigger initial analysis on upload for seamless UX
    from app.services.analyzer_pipeline import AnalyzerPipeline
    analysis_result = AnalyzerPipeline.run_analysis(
        document_id=doc_id_str,
        user_id=str(user_obj_id),
        full_text=parsed_doc["full_text"],
        pages_metadata=parsed_doc["pages"]
    )

    return success_response(
        data={
            "document": analysis_result["document"],
            "summary": analysis_result["summary"],
            "clauses": analysis_result["clauses"],
            "entities": analysis_result["entities"],
            "compliance": analysis_result["compliance"],
            "pages_count": parsed_doc["page_count"],
            "chunks_count": len(chunks),
            "chunks": chunks,
            "full_text": parsed_doc["full_text"]
        },
        message="Document uploaded and analyzed successfully.",
        status_code=201
    )

@router.post("/{document_id}/analyze")
async def reanalyze_document(
    document_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Trigger or re-trigger ML legal analysis on an existing document."""
    user_id = current_user["id"]
    try:
        doc_obj_id = ObjectId(document_id)
        user_obj_id = ObjectId(user_id)
    except Exception:
        return error_response(
            message="Invalid document ID format.",
            error_code="INVALID_DOCUMENT_ID",
            status_code=400
        )

    docs_col = Database.get_documents_collection()
    doc = docs_col.find_one({"_id": doc_obj_id, "user_id": user_obj_id})
    if not doc:
        return error_response(
            message="Document not found or access unauthorized.",
            error_code="DOCUMENT_NOT_FOUND",
            status_code=404
        )

    # Attempt to use text from request body first; fall back to stored full_text
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    text_content = payload.get("text", "").strip() if isinstance(payload, dict) else ""

    if not text_content:
        # Prefer the document's persisted full_text over synthesizing from clause fragments
        text_content = (doc.get("full_text") or "").strip()

    if not text_content:
        return error_response(
            message="No text content found to re-analyze. The original document text was not stored.",
            error_code="EMPTY_CONTENT",
            status_code=400
        )

    from app.services.analyzer_pipeline import AnalyzerPipeline
    try:
        analysis_result = AnalyzerPipeline.run_analysis(
            document_id=document_id,
            user_id=user_id,
            full_text=text_content
        )
        return success_response(
            data=analysis_result,
            message="Document analysis completed successfully."
        )
    except Exception as e:
        return error_response(
            message="Analysis pipeline encountered an error.",
            error_code="ANALYSIS_FAILED",
            status_code=500,
            details=str(e)
        )

@router.get("")
async def list_documents(
    request: Request,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """List paginated documents belonging to current user."""
    user_id = current_user["id"]
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        user_obj_id = user_id

    page = max(1, page)
    limit = max(1, min(100, limit))

    docs_col = Database.get_documents_collection()
    summaries_col = Database.get_summaries_collection()

    total = docs_col.count_documents({"user_id": user_obj_id})
    total_pages = math.ceil(total / limit) if total > 0 else 1

    documents = list(
        docs_col.find({"user_id": user_obj_id})
        .sort("created_at", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )

    # Enrich documents with summary snippet if available
    enriched_docs = []
    for doc in documents:
        doc_id = doc["_id"]
        summary = summaries_col.find_one({"document_id": doc_id})
        doc_serialized = serialize_doc(doc)
        if summary:
            doc_serialized["summary_snippet"] = summary.get("summary_text", "")[:200]
            doc_serialized["key_takeaways_count"] = len(summary.get("key_takeaways", []))
        else:
            doc_serialized["summary_snippet"] = None
            doc_serialized["key_takeaways_count"] = 0
        enriched_docs.append(doc_serialized)

    meta_info = {"total": total, "page": page, "limit": limit, "total_pages": total_pages}
    return success_response(
        data={"documents": enriched_docs, "meta": meta_info},
        message="User documents retrieved successfully.",
        meta=meta_info
    )

@router.get("/{document_id}")
async def get_document_details(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve document metadata, summary, extracted clauses, and entities."""
    user_id = current_user["id"]
    try:
        doc_obj_id = ObjectId(document_id)
        user_obj_id = ObjectId(user_id)
    except Exception:
        return error_response(
            message="Invalid document ID format.",
            error_code="INVALID_DOCUMENT_ID",
            status_code=400
        )

    docs_col = Database.get_documents_collection()
    doc = docs_col.find_one({"_id": doc_obj_id, "user_id": user_obj_id})
    if not doc:
        return error_response(
            message="Document not found or access unauthorized.",
            error_code="DOCUMENT_NOT_FOUND",
            status_code=404
        )

    summaries_col = Database.get_summaries_collection()
    clauses_col = Database.get_clauses_collection()
    entities_col = Database.get_entities_collection()

    summary = summaries_col.find_one({"document_id": doc_obj_id})
    clauses = list(clauses_col.find({"document_id": doc_obj_id}).sort("start_char", 1))
    entities = list(entities_col.find({"document_id": doc_obj_id}))

    full_text = doc.get("full_text") or ""
    if not full_text and clauses:
        full_text = "\n\n".join([c.get("clause_text", "").strip() for c in clauses if c.get("clause_text")])

    return success_response(
        data={
            "document": serialize_doc(doc),
            "summary": serialize_doc(summary),
            "clauses": serialize_doc(clauses),
            "entities": serialize_doc(entities),
            "full_text": full_text
        },
        message="Document details retrieved successfully."
    )

@router.get("/{document_id}/export")
async def export_document_pdf(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate and stream a PDF analysis report for a document."""
    user_id = current_user["id"]
    try:
        doc_obj_id = ObjectId(document_id)
        user_obj_id = ObjectId(user_id)
    except Exception:
        return error_response(
            message="Invalid document ID format.",
            error_code="INVALID_DOCUMENT_ID",
            status_code=400
        )

    docs_col = Database.get_documents_collection()
    doc = docs_col.find_one({"_id": doc_obj_id, "user_id": user_obj_id})
    if not doc:
        return error_response(
            message="Document not found or access unauthorized.",
            error_code="DOCUMENT_NOT_FOUND",
            status_code=404
        )

    summary = Database.get_summaries_collection().find_one({"document_id": doc_obj_id})
    clauses = list(Database.get_clauses_collection().find({"document_id": doc_obj_id}).sort("start_char", 1))
    entities = list(Database.get_entities_collection().find({"document_id": doc_obj_id}))

    try:
        from app.services.pdf_exporter import generate_pdf_report
        pdf_bytes = generate_pdf_report(
            document=serialize_doc(doc),
            summary=serialize_doc(summary) if summary else None,
            clauses=serialize_doc(clauses),
            entities=serialize_doc(entities),
        )
    except Exception as e:
        return error_response(
            message="Failed to generate PDF export.",
            error_code="EXPORT_FAILED",
            status_code=500,
            details=str(e)
        )

    safe_filename = (doc.get("filename") or "analysis").rsplit(".", 1)[0]
    safe_filename = "".join(c if c.isalnum() or c in "-_" else "_" for c in safe_filename)
    download_name = f"{safe_filename}_amicus_report.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{download_name}"',
            "Content-Length": str(len(pdf_bytes)),
        }
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Hard delete document and all associated summaries, clauses, and entities."""
    user_id = current_user["id"]
    try:
        doc_obj_id = ObjectId(document_id)
        user_obj_id = ObjectId(user_id)
    except Exception:
        return error_response(
            message="Invalid document ID format.",
            error_code="INVALID_DOCUMENT_ID",
            status_code=400
        )

    docs_col = Database.get_documents_collection()
    doc = docs_col.find_one({"_id": doc_obj_id, "user_id": user_obj_id})
    if not doc:
        return error_response(
            message="Document not found or access unauthorized.",
            error_code="DOCUMENT_NOT_FOUND",
            status_code=404
        )

    db_client = getattr(Database, "client", None)
    session_used = False
    if db_client is not None:
        try:
            with db_client.start_session() as session:
                with session.start_transaction():
                    docs_col.delete_one({"_id": doc_obj_id}, session=session)
                    Database.get_summaries_collection().delete_many({"document_id": doc_obj_id}, session=session)
                    Database.get_clauses_collection().delete_many({"document_id": doc_obj_id}, session=session)
                    Database.get_entities_collection().delete_many({"document_id": doc_obj_id}, session=session)
            session_used = True
        except Exception:
            pass

    if not session_used:
        docs_col.delete_one({"_id": doc_obj_id})
        Database.get_summaries_collection().delete_many({"document_id": doc_obj_id})
        Database.get_clauses_collection().delete_many({"document_id": doc_obj_id})
        Database.get_entities_collection().delete_many({"document_id": doc_obj_id})

    return success_response(
        data={"deleted_document_id": document_id},
        message="Document and all associated analysis records permanently deleted."
    )

