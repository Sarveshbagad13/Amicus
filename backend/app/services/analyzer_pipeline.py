import logging
import concurrent.futures
from datetime import datetime, timezone
from bson import ObjectId
from typing import Dict, Any, List
from app.config import Config
from app.db import Database, serialize_doc
from app.services.clause_extractor import ClauseExtractor
from app.services.ner_service import EntityExtractor
from app.services.summarizer import ContractSummarizer, BillSummarizer
from app.services.guardrails import ModelGuardrails
from app.services.document_classifier import detect_document_type

logger = logging.getLogger(__name__)

class InferenceTimeoutError(TimeoutError):
    """Raised when inference exceeds the synchronous execution time limit."""
    pass

class AnalyzerPipeline:
    """
    Master orchestrator for the Amicus Legal Text Analysis Pipeline.
    Coordinates Clause Extraction, Abstractive Summarization, NER, and Guardrails.
    Enforces synchronous timeout guardrails without external task queues.
    """

    @classmethod
    def run_analysis(
        cls,
        document_id: str,
        user_id: str,
        full_text: str,
        pages_metadata: List[Dict[str, Any]] = None,
        model_name: str = "bart-legal-contract-v1",
        timeout_seconds: int = None
    ) -> Dict[str, Any]:
        """
        Execute full legal analysis on a document wrapped in an inference timeout guardrail.
        On timeout, aborts cleanly, sets document status to FAILED, and ensures no partial data is persisted.
        """
        if timeout_seconds is None:
            timeout_seconds = getattr(Config, "INFERENCE_TIMEOUT_SECONDS", 45)

        try:
            doc_obj_id = ObjectId(document_id)
            user_obj_id = ObjectId(user_id)
        except Exception as e:
            raise ValueError(f"Invalid ObjectId format: {e}")

        # Execute analysis synchronously in a watchdog worker thread with hard timeout
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                cls._execute_analysis,
                doc_obj_id,
                user_obj_id,
                document_id,
                full_text,
                pages_metadata,
                model_name
            )
            try:
                return future.result(timeout=timeout_seconds)
            except concurrent.futures.TimeoutError:
                logger.error(
                    "Analysis pipeline timed out after %s seconds on document %s",
                    timeout_seconds, document_id
                )
                # Ensure no partial data is persisted across collections
                try:
                    Database.get_summaries_collection().delete_many({"document_id": doc_obj_id})
                    Database.get_clauses_collection().delete_many({"document_id": doc_obj_id})
                    Database.get_entities_collection().delete_many({"document_id": doc_obj_id})
                    Database.get_documents_collection().update_one(
                        {"_id": doc_obj_id},
                        {"$set": {
                            "status": "FAILED",
                            "error_message": f"Inference timed out after {timeout_seconds} seconds."
                        }}
                    )
                except Exception as cleanup_err:
                    logger.error("Error cleaning up partial analysis data on timeout: %s", cleanup_err)

                raise InferenceTimeoutError(f"Inference timed out after {timeout_seconds} seconds.")

    @classmethod
    def _execute_analysis(
        cls,
        doc_obj_id: ObjectId,
        user_obj_id: ObjectId,
        document_id: str,
        full_text: str,
        pages_metadata: List[Dict[str, Any]],
        model_name: str
    ) -> Dict[str, Any]:
        """Synchronous analysis execution."""
        docs_col = Database.get_documents_collection()
        summaries_col = Database.get_summaries_collection()
        clauses_col = Database.get_clauses_collection()
        entities_col = Database.get_entities_collection()

        # Update status to PROCESSING
        docs_col.update_one(
            {"_id": doc_obj_id, "user_id": user_obj_id},
            {"$set": {"status": "PROCESSING", "error_message": None}}
        )

        try:
            now = datetime.now(timezone.utc)

            # 1. Detect document type (BILL vs CONTRACT)
            doc_type = detect_document_type(full_text)
            logger.info("Document %s classified as: %s", document_id, doc_type)

            # 2. Clause Extraction — skipped for bills and unsupported types
            if doc_type in ("BILL", "UNSUPPORTED"):
                clauses = []
                logger.info(
                    "Skipping ClauseExtractor for %s document (CUAD extraction not applicable)",
                    doc_type
                )
            else:
                clauses = ClauseExtractor.extract_clauses(full_text, pages_metadata)

            # 3. Entity Extraction (runs for all document types)
            entities = EntityExtractor.extract_entities(full_text)
            extraction_mode = EntityExtractor.get_extraction_mode()

            # 4. Route to correct summarizer based on detected document type
            if doc_type == "BILL":
                summary_text, key_takeaways, token_count = BillSummarizer.generate_summary(
                    full_text,
                    extracted_entities=entities,
                )
                effective_model = "billsum-template-v1"
            elif doc_type == "CONTRACT":
                summary_text, key_takeaways, token_count = ContractSummarizer.generate_summary(
                    full_text,
                    extracted_clauses=clauses,
                    extracted_entities=entities,
                )
                effective_model = model_name
            else:
                logger.info(
                    "Document %s is UNSUPPORTED — skipping summarizer, returning fallback message",
                    document_id
                )
                summary_text = (
                    "This document type isn't currently supported for automated summarization. "
                    "Amicus currently supports legislative bills/statutes and commercial contracts. "
                    "Extracted entities are shown below where available."
                )
                key_takeaways = [
                    "Document type not recognized as a supported bill or contract format."
                ]
                token_count = 0
                effective_model = "unsupported-doc-type"

            # Clean old records if re-analyzing
            summaries_col.delete_many({"document_id": doc_obj_id})
            clauses_col.delete_many({"document_id": doc_obj_id})
            entities_col.delete_many({"document_id": doc_obj_id})

            # 5. Persist Summary
            summary_doc = {
                "document_id": doc_obj_id,
                "user_id": user_obj_id,
                "model_name": effective_model,
                "doc_type": doc_type,
                "summary_text": summary_text,
                "key_takeaways": key_takeaways,
                "token_count": token_count,
                "created_at": now
            }
            sum_res = summaries_col.insert_one(summary_doc)
            summary_doc["_id"] = sum_res.inserted_id

            # 6. Persist Extracted Clauses (including description field)
            saved_clauses = []
            for c in clauses:
                clause_doc = {
                    "document_id": doc_obj_id,
                    "user_id": user_obj_id,
                    "category": c["category"],
                    "clause_text": c["clause_text"],
                    "start_char": c["start_char"],
                    "end_char": c["end_char"],
                    "page_number": c["page_number"],
                    "description": c.get("description", ""),
                    "created_at": now
                }
                c_res = clauses_col.insert_one(clause_doc)
                clause_doc["_id"] = c_res.inserted_id
                saved_clauses.append(clause_doc)

            # 7. Persist Extracted Entities
            saved_entities = []
            for ent in entities:
                ent_doc = {
                    "document_id": doc_obj_id,
                    "user_id": user_obj_id,
                    "entity_type": ent["entity_type"],
                    "text": ent["text"],
                    "context": ent["context"],
                    "created_at": now
                }
                e_res = entities_col.insert_one(ent_doc)
                ent_doc["_id"] = e_res.inserted_id
                saved_entities.append(ent_doc)

            # 8. Update Document Status to COMPLETED only if not timed out / marked FAILED
            curr_doc = docs_col.find_one({"_id": doc_obj_id})
            if curr_doc and curr_doc.get("status") == "FAILED":
                logger.warning(
                    "Document %s was marked FAILED by timeout watchdog. Discarding worker completion.",
                    document_id
                )
                summaries_col.delete_many({"document_id": doc_obj_id})
                clauses_col.delete_many({"document_id": doc_obj_id})
                entities_col.delete_many({"document_id": doc_obj_id})
                return {}

            docs_col.update_one(
                {"_id": doc_obj_id, "status": {"$ne": "FAILED"}},
                {"$set": {"status": "COMPLETED"}}
            )
            updated_doc = docs_col.find_one({"_id": doc_obj_id})

            return {
                "status": "COMPLETED",
                "document": serialize_doc(updated_doc),
                "summary": serialize_doc(summary_doc),
                "clauses": serialize_doc(saved_clauses),
                "entities": serialize_doc(saved_entities),
                "compliance": ModelGuardrails.get_compliance_payload(),
                "entity_extraction_mode": extraction_mode
            }

        except Exception as e:
            logger.error(f"Analysis pipeline failure on doc {document_id}: {e}", exc_info=True)
            docs_col.update_one(
                {"_id": doc_obj_id},
                {"$set": {"status": "FAILED", "error_message": str(e)}}
            )
            raise e
