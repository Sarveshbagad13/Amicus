import io
import logging
import fitz  # PyMuPDF
import docx
from langdetect import detect_langs, LangDetectException

logger = logging.getLogger(__name__)

class DocumentParsingError(Exception):
    """Base exception for parsing issues."""
    pass

class UnsupportedFormatError(DocumentParsingError):
    """Raised when file extension or MIME type is not PDF or DOCX."""
    pass

class CorruptedFileError(DocumentParsingError):
    """Raised when file cannot be read or is corrupted/password-protected."""
    pass

class ScannedDocumentError(DocumentParsingError):
    """Raised when PDF or document has no selectable text layer (scanned)."""
    pass

class UnsupportedLanguageError(DocumentParsingError):
    """Raised when document language is not English."""
    pass

class DocumentParser:
    ALLOWED_EXTENSIONS = {"pdf", "docx"}
    MIN_TEXT_LENGTH = 50  # PRD Section 6: len(extracted_text) < 50 indicates scanned image

    @classmethod
    def parse(cls, file_bytes: bytes, filename: str) -> dict:
        """
        Parse raw bytes from a PDF or DOCX file into structured text, page metadata,
        and validate against PRD constraints (scanned PDF, language, corruption).
        """
        if not file_bytes or len(file_bytes) == 0:
            raise CorruptedFileError("The uploaded file is empty.")

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise UnsupportedFormatError(
                f"Unsupported file format '.{ext}'. Only .pdf and .docx files are supported."
            )

        if ext == "pdf":
            parsed = cls._parse_pdf(file_bytes, filename)
        else:
            parsed = cls._parse_docx(file_bytes, filename)

        # Validate English language (PRD Section 6)
        cls._validate_language(parsed["full_text"])

        return parsed

    @classmethod
    def _parse_pdf(cls, file_bytes: bytes, filename: str) -> dict:
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise CorruptedFileError(
                "Unable to open file. Please ensure the document is not password-protected or corrupted."
            ) from e

        if doc.is_encrypted:
            doc.close()
            raise CorruptedFileError(
                "Unable to open file. Please ensure the document is not password-protected or corrupted."
            )

        page_count = len(doc)
        pages_data = []
        full_text_parts = []
        current_offset = 0

        for page_idx in range(page_count):
            page = doc[page_idx]
            page_text = page.get_text("text") or ""
            start_char = current_offset
            end_char = start_char + len(page_text)
            
            pages_data.append({
                "page_number": page_idx + 1,
                "text": page_text,
                "start_char": start_char,
                "end_char": end_char,
                "char_length": len(page_text)
            })

            full_text_parts.append(page_text)
            current_offset = end_char + 1  # +1 for newline join separator

        doc.close()
        full_text = "\n".join(full_text_parts).strip()

        # Scanned PDF check (PRD Section 6) — attempt OCR before raising error
        if len(full_text) < cls.MIN_TEXT_LENGTH:
            logger.info(
                "Extracted text too short (%d chars) for %s. Attempting OCR fallback.",
                len(full_text), filename
            )
            ocr_result = cls._attempt_ocr(file_bytes, filename)
            if ocr_result is not None:
                return ocr_result
            raise ScannedDocumentError(
                "This document contains scanned images without a selectable text layer. "
                "OCR extraction was attempted but did not yield sufficient readable text. "
                "Please upload an electronically generated PDF or a high-quality OCR-processed document."
            )

        return {
            "filename": filename,
            "file_type": "application/pdf",
            "file_size_bytes": len(file_bytes),
            "page_count": page_count,
            "raw_text_length": len(full_text),
            "full_text": full_text,
            "pages": pages_data
        }

    @classmethod
    def _attempt_ocr(cls, file_bytes: bytes, filename: str):
        """
        Attempt OCR on a scanned PDF using pytesseract.

        Image source: PyMuPDF pixmap renderer (avoids poppler/pdf2image dependency
        while providing equivalent rasterisation quality at 300 DPI).

        NOTE: This runs synchronously within the HTTP request. For large documents
        (>10 pages) this may add 10-30 s of latency. The inference timeout guardrail
        in AnalyzerPipeline limits total exposure to INFERENCE_TIMEOUT_SECONDS.

        Returns parsed document dict on success, or None when OCR is unavailable
        or yields insufficient text.
        """
        try:
            import pytesseract
            from PIL import Image
        except ImportError:
            logger.warning(
                "pytesseract or Pillow not installed. OCR fallback unavailable for %s.", filename
            )
            return None

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception:
            return None

        page_count = len(doc)
        pages_data = []
        full_text_parts = []
        current_offset = 0

        try:
            for page_idx in range(page_count):
                page = doc[page_idx]
                # Render at 300 DPI (scale factor ~4.17x the default 72 DPI)
                mat = fitz.Matrix(300 / 72, 300 / 72)
                pix = page.get_pixmap(matrix=mat, alpha=False)
                img_bytes = pix.tobytes("png")
                pil_image = Image.open(io.BytesIO(img_bytes))

                try:
                    page_text = pytesseract.image_to_string(pil_image, lang="eng") or ""
                except Exception as ocr_err:
                    logger.warning("OCR failed for page %d of %s: %s", page_idx + 1, filename, ocr_err)
                    page_text = ""

                start_char = current_offset
                end_char = start_char + len(page_text)

                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": page_text,
                    "start_char": start_char,
                    "end_char": end_char,
                    "char_length": len(page_text),
                    "ocr": True
                })

                full_text_parts.append(page_text)
                current_offset = end_char + 1
        finally:
            doc.close()

        full_text = "\n".join(full_text_parts).strip()

        if len(full_text) < cls.MIN_TEXT_LENGTH:
            logger.warning(
                "OCR fallback yielded insufficient text (%d chars) for %s.", len(full_text), filename
            )
            return None

        logger.info("OCR fallback successful for %s: %d chars extracted.", filename, len(full_text))
        return {
            "filename": filename,
            "file_type": "application/pdf",
            "file_size_bytes": len(file_bytes),
            "page_count": page_count,
            "raw_text_length": len(full_text),
            "full_text": full_text,
            "pages": pages_data,
            "ocr_applied": True
        }

    @classmethod
    def _parse_docx(cls, file_bytes: bytes, filename: str) -> dict:
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
        except Exception as e:
            raise CorruptedFileError(
                "Unable to open file. Please ensure the document is not password-protected or corrupted."
            ) from e

        paragraphs_text = []
        for p in doc.paragraphs:
            if p.text.strip():
                paragraphs_text.append(p.text.strip())

        # Also extract table text
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                if row_text:
                    paragraphs_text.append(row_text)

        full_text = "\n\n".join(paragraphs_text).strip()

        if len(full_text) < cls.MIN_TEXT_LENGTH:
            raise ScannedDocumentError(
                "The document has insufficient readable text. "
                "Please upload a complete contract with readable digital text."
            )

        # Estimate page count for docx (~350 words or 2200 chars per page standard contract density)
        estimated_pages = max(1, round(len(full_text) / 2200))

        return {
            "filename": filename,
            "file_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "file_size_bytes": len(file_bytes),
            "page_count": estimated_pages,
            "raw_text_length": len(full_text),
            "full_text": full_text,
            "pages": [
                {
                    "page_number": 1,
                    "text": full_text,
                    "start_char": 0,
                    "end_char": len(full_text),
                    "char_length": len(full_text)
                }
            ]
        }

    @classmethod
    def _validate_language(cls, text: str):
        sample = text[:1500].strip()
        if not sample:
            return

        try:
            detections = detect_langs(sample)
            # Find probability for English ('en')
            en_prob = next((d.prob for d in detections if d.lang == "en"), 0.0)
            primary_lang = detections[0].lang if detections else "unknown"

            # If primary detected is not English and english confidence is low
            if primary_lang != "en" and en_prob < 0.60:
                raise UnsupportedLanguageError(
                    "Phase 1 only supports English-language contracts."
                )
        except LangDetectException:
            # If language detector fails on very legalistic/symbol-heavy snippet, fallback gracefully
            pass
