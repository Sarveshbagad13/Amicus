# Product Requirements Document (PRD)
# Amicus — AI-Powered Legal Text Analyzer

| Field | Value |
|---|---|
| **Document Version** | 2.0 |
| **Last Updated** | October 17, 2026 |
| **Status** | Phase 1 — Implemented & Active |
| **Author / Reviewer** | Engineering Team |
| **Classification** | Internal — Confidential |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [Product Vision & Goals](#4-product-vision--goals)
5. [Tech Stack](#5-tech-stack)
6. [AI / ML Model Architecture](#6-ai--ml-model-architecture)
7. [Feature Specifications](#7-feature-specifications)
8. [API Surface & Data Model](#8-api-surface--data-model)
9. [Success Metrics & Benchmarks](#9-success-metrics--benchmarks)
10. [Edge Cases & Failure States](#10-edge-cases--failure-states)
11. [Legal, Compliance & Guardrails](#11-legal-compliance--guardrails)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Scope: In-Scope vs Out-of-Scope](#13-scope-in-scope-vs-out-of-scope)
14. [Assumptions & Constraints](#14-assumptions--constraints)
15. [Gaps & Recommendations (Missing from Current Implementation)](#15-gaps--recommendations-missing-from-current-implementation)
16. [Open Questions & Roadmap](#16-open-questions--roadmap)

---

## 1. Executive Summary

**Amicus** is a self-serve, AI-powered legal document analysis web application that enables freelancers, small business owners, and non-lawyers to understand the key obligations, risks, and terms of commercial contracts and legislative bills — without needing to hire legal counsel.

The platform accepts PDF and DOCX document uploads, automatically classifies the document type (CONTRACT vs. BILL vs. UNSUPPORTED), and runs a multi-stage NLP/ML inference pipeline to produce:

- A **plain-English abstractive summary** of the document
- **Key clause extraction** against CUAD benchmark categories (Indemnity, Termination, Auto-Renewal, etc.)
- **Named Entity Recognition (NER)** for parties, dates, money, and governing law
- A **structured analysis dashboard** with a persistent document history
- A **downloadable PDF analysis report**

All outputs are gated through strict behavioral guardrails to ensure the platform never constitutes legal advice.

---

## 2. Problem Statement

Freelancers and small business operators regularly receive commercial agreements (NDAs, Master Services Agreements, Statements of Work, Subcontractor Agreements, SaaS Vendor Contracts, and legislative bills affecting their industry). The core friction points are:

- **Cost barrier:** Retaining legal counsel for routine contract review costs $250–$600/hour — prohibitive for individual freelancers and small businesses.
- **Knowledge barrier:** Non-lawyers reading dense legal prose regularly miss auto-renewal traps, unilateral indemnity liabilities, non-standard termination windows, and unclear payment milestones.
- **Time barrier:** A 20-page MSA requires 2–4 hours of focused reading for a non-lawyer to understand at a basic level.

**Amicus solves this** by providing a self-serve, AI-driven "first pass" analyzer that extracts key clauses, identifies critical commercial terms, and summarizes obligations in plain English — enabling a non-lawyer to understand their exposure in under 2 minutes.

> [!IMPORTANT]
> Amicus is **not** a replacement for a qualified attorney. All outputs are informational only and are subject to strict non-advisory guardrails (Section 11).

---

## 3. Target Users & Personas

| Persona | Description | Primary Need |
|---|---|---|
| **Freelancer / Independent Contractor** | Receives client MSAs, Statements of Work, and IP assignment agreements | Understand payment terms, IP ownership, non-compete scope, and termination notice windows before signing |
| **Small Business Owner / Founder** | Reviews vendor contracts, SaaS T&Cs, subcontractor agreements | Identify auto-renewal traps, liability caps, indemnification scope, and governing law jurisdiction |
| **Solo Operator / Non-Lawyer** | Handles contracts without in-house legal support | Get a plain-English summary of obligations, deadlines, and risk provisions |
| **Policy Researcher / Analyst** | Reviews legislative bills, statutes, and government documents | Understand fiscal impact, key dates, section structure, and compliance requirements |

---

## 4. Product Vision & Goals

**Vision:** Make contract literacy accessible to every non-lawyer — without a law degree or a legal budget.

**Phase 1 Goals:**
1. Achieve accurate clause extraction (F1 ≥ 90%) against CUAD benchmark categories for commercial contracts.
2. Generate coherent, plain-language summaries that reflect the document's core obligations (ROUGE-1 ≥ 40%).
3. Support PDF and DOCX ingestion with ≥ 98% parsing success rate for digitally-generated documents.
4. Maintain P95 end-to-end latency under 2 seconds on standard commercial contracts.
5. Enforce legal non-advisory guardrails with 100% compliance across all generated outputs.

---

## 5. Tech Stack

### 5.1 Frontend

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **UI Framework** | React | 18.3.1 | Component-based architecture for stateful document workspace; no router needed (state-machine navigation) |
| **Build Tool** | Vite | 5.3.1 | Fast HMR development experience; optimized production bundles via Rollup |
| **Styling** | Tailwind CSS | 3.4.4 | Utility-first design system for rapid UI development; custom token layer for branding |
| **Icons** | Lucide React | 0.344.0 | Consistent, lightweight SVG icon library |
| **State Management** | React Context API | Built-in | AuthContext manages authentication state; no Redux needed for this scope |
| **HTTP Client** | Native `fetch` API | — | Lightweight, no external dependency needed for REST API calls |
| **Deployment** | Vercel | — | Zero-config deployment for React/Vite SPAs; `vercel.json` rewrite rules for SPA routing |

### 5.2 Backend

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Web Framework** | FastAPI | ≥ 0.110.0 | Async-capable Python ASGI framework; automatic OpenAPI docs; native Pydantic validation |
| **ASGI Server** | Uvicorn (with standard extras) | ≥ 0.28.0 | Production-grade ASGI server with WebSocket and HTTP/2 support |
| **Authentication** | PyJWT + bcrypt | ≥ 2.8.0 / ≥ 4.1.2 | Stateless JWT tokens for API authentication; bcrypt for password hashing (cost factor 12) |
| **Database Driver** | PyMongo | ≥ 4.6.1 | Synchronous MongoDB driver; async motor considered but sync sufficient for current load profile |
| **Test Database** | MongMock | ≥ 4.1.2 | In-memory MongoDB mock for unit/integration tests without a live database |
| **HTTP Client** | HTTPX | ≥ 0.27.0 | Async-capable HTTP client for external service calls |
| **Environment** | python-dotenv | ≥ 1.0.1 | 12-factor app config via `.env` files |
| **Form/File Parsing** | python-multipart | ≥ 0.0.9 | Required by FastAPI for multipart file upload handling |

### 5.3 Document Processing

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **PDF Parsing** | PyMuPDF (fitz) | ≥ 1.23.0 | Fast, robust PDF text extraction with per-page character offsets; handles most digital PDFs |
| **DOCX Parsing** | python-docx | ≥ 1.1.0 | Extracts paragraph text, table contents, and structure from Word documents |
| **OCR Fallback** | pytesseract + pdf2image / PyMuPDF pixmap | ≥ 0.3.10 | Rasterizes scanned PDF pages at 300 DPI and runs Tesseract OCR as a fallback path |
| **Language Detection** | langdetect | ≥ 1.0.9 | Detects non-English documents before pipeline execution |
| **PDF Export** | WeasyPrint (primary) / PyMuPDF (fallback) | ≥ 60.0 | Generates styled HTML→PDF analysis reports; PyMuPDF fallback for environments without GTK/Cairo |

### 5.4 AI / ML Stack

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Deep Learning Runtime** | PyTorch | ≥ 2.0.0 | Neural model inference for BART and RoBERTa; GPU-accelerated when available (CUDA), CPU fallback |
| **Model Hub / Inference** | Hugging Face Transformers | ≥ 4.38.0 | `AutoTokenizer`, `AutoModelForSeq2SeqLM` (BART), `AutoModelForQuestionAnswering` (RoBERTa) |
| **NER Pipeline** | spaCy | ≥ 3.7.0 | `en_core_web_sm` pipeline for named entity extraction (ORG, PERSON, DATE, MONEY, GPE) |

### 5.5 Database

| Component | Technology | Notes |
|---|---|---|
| **Primary Database** | MongoDB | NoSQL document store; 5 collections: `users`, `documents`, `summaries`, `extracted_clauses`, `extracted_entities` |
| **Fallback (Dev/Test)** | MongMock (in-memory) | Auto-switches to in-memory mock when live MongoDB is not reachable |

### 5.6 Testing

| Tool | Purpose |
|---|---|
| pytest ≥ 8.0.0 | Backend unit and integration tests |
| MongMock | In-memory MongoDB for isolated test runs |

---

## 6. AI / ML Model Architecture

### 6.1 Model Overview

Amicus uses a **three-component ML pipeline**, each with a neural primary path and a deterministic rule-based fallback:

```
Document Text
     │
     ├─── [1] Document Classifier ──────────────────────► BILL / CONTRACT / UNSUPPORTED
     │           (Regex heuristics, preamble scan)
     │
     ├─── [2] Clause Extractor (CONTRACT only)
     │           Primary:  Fine-tuned RoBERTa (QA, CUAD)
     │           Fallback: CUAD regex/keyword patterns
     │           Output:   8 clause categories with verbatim spans
     │
     ├─── [3] Named Entity Recognizer (all doc types)
     │           Primary:  spaCy en_core_web_sm NER
     │           Fallback: Regex patterns (PARTY, DATE, MONEY, GOVERNING_LAW)
     │           Output:   Structured entity list with context
     │
     └─── [4] Summarizer
                 CONTRACT: Fine-tuned BART (bart-legal-contract-v1)
                           Warm-started on BillSum → fine-tuned on contracts
                           Map-Reduce chunking strategy (500 words/chunk, 50-word overlap)
                 BILL:     BillSummarizer (template + regex signal extraction)
                 UNSUPPORTED: Static fallback message
```

### 6.2 Summarization Model — BART

| Property | Value |
|---|---|
| **Architecture** | `facebook/bart-base` (Seq2Seq encoder-decoder) |
| **Fine-tuned Checkpoint** | `bart-legal-contract-v1` (stored at `./models/bart-billsum-warmup`) |
| **Training Strategy** | Stage 1: BillSum warm-up (legal syntax adaptation) → Stage 2: Contract summary fine-tuning |
| **Inference Strategy** | Map-Reduce: per-chunk summaries (max 200 tokens, 2 beams) → synthesis pass (max 350 tokens, 3 beams) |
| **Context Window** | 1,024 tokens per chunk; 500-word chunk size with 50-word overlaps |
| **Fallback** | Template-based rule engine using extracted clauses and entities |
| **Guardrails** | `ModelGuardrails.sanitize_text()` post-processing on all generated text |

### 6.3 Clause Extraction Model — RoBERTa

| Property | Value |
|---|---|
| **Architecture** | `roberta-base` (Encoder, QA fine-tune for extractive span prediction) |
| **Fine-tuned Checkpoint** | `roberta-cuad-clause-extractor` (stored at `./models/roberta-cuad-clause-extractor`) |
| **Training Dataset** | CUAD (Contract Understanding Atticus Dataset) — 510 contracts, 41 clause categories |
| **Inference Strategy** | Sliding window QA: per CUAD category question → span extraction per 350-word chunk |
| **Confidence Threshold** | 0.65 (spans below threshold are discarded) |
| **Deduplication** | IoU-based deduplication across overlapping chunks (IoU threshold = 0.5) |
| **Target Categories** | Indemnity, Termination, Auto-Renewal, Confidentiality, Governing Law, Limitation of Liability, Non-Compete / Restrictive Covenants, Payment Terms |
| **Fallback** | CUAD regex/keyword patterns with keyword-density confidence scoring |

### 6.4 Named Entity Recognition — spaCy

| Property | Value |
|---|---|
| **Model** | `spaCy en_core_web_sm` |
| **Entity Types Extracted** | `PARTY` (ORG/PERSON), `DATE` (DATE/TIME), `MONEY` (MONEY/PERCENT), `GOVERNING_LAW` (GPE) |
| **Supplementary Patterns** | Regex patterns for contracting parties (preamble), monetary terms, dates, and jurisdiction names |
| **Context Window** | 25,000 character cap on spaCy NER; regex patterns run on full text |
| **Fallback** | Pure regex extraction when spaCy model is not loaded (reduced mode) |

### 6.5 Document Classifier

| Property | Value |
|---|---|
| **Method** | Rule-based regex signal scan on the first 3,000 characters (preamble) |
| **BILL signals** | `AN ACT`, `Be it enacted by`, `IN THE SENATE/HOUSE OF REPRESENTATIVES`, `Congress finds/declares`, `TITLE [IVX]+`, `SECTION \d+.` |
| **CONTRACT signals** | `WHEREAS`, `the Parties agree`, `this Agreement`, `Effective Date`, `IN WITNESS WHEREOF`, `NOW THEREFORE` |
| **Priority** | BILL signals are checked first (early exit); avoids contract-hallucinations on legislative text |
| **Output** | `"BILL"` \| `"CONTRACT"` \| `"UNSUPPORTED"` |

### 6.6 Inference Timeout Guardrail

All ML inference is wrapped in a `ThreadPoolExecutor` watchdog with a configurable hard timeout (`INFERENCE_TIMEOUT_SECONDS`, default 45 seconds). On timeout:
1. All partial data (summaries, clauses, entities) is deleted from the database.
2. Document status is set to `FAILED`.
3. An `InferenceTimeoutError` is raised, surfacing a clean error to the client.

---

## 7. Feature Specifications

### Feature 1: User Authentication

**What it is:** A complete registration and login system using email/password credentials, secured with bcrypt password hashing and JWT-based stateless API tokens.

**Why it exists:** Analysis history must be scoped per user. Without authentication, any user could access any document. JWT tokens allow stateless API authentication compatible with a serverless/Render deployment without session storage.

**Implementation Details:**
- `POST /api/auth/register` — creates a new user account; returns JWT token immediately (no email verification in v1)
- `POST /api/auth/login` — validates bcrypt password hash; returns JWT token (24-hour expiry by default, configurable via `JWT_EXPIRATION_HOURS`)
- `GET /api/auth/me` — returns current authenticated user profile from token
- Passwords hashed with bcrypt (cost factor ≥ 12)
- JWT signed with `HS256` using configurable `JWT_SECRET_KEY`
- Auth middleware (`get_current_user` dependency injection) protects all document endpoints

**UI Components:** `AuthModal` (login/register tab toggle), `AuthProvider` (React Context with token persistence in `localStorage`)

---

### Feature 2: Document Upload & Parsing

**What it is:** A drag-and-drop or click-to-browse file upload zone that accepts PDF and DOCX files up to 20 MB, extracts full text content with per-page character offsets, and validates the document before persisting it.

**Why it exists:** The entire analysis pipeline depends on clean, structured text extraction. The parser must handle diverse PDF encodings, DOCX formatting variations, scanned images, and corrupted files gracefully while providing actionable error messages.

**Implementation Details:**
- `POST /api/documents/upload` — multipart file upload endpoint
- **PDF parsing:** PyMuPDF (`fitz`) extracts per-page text with `start_char`/`end_char` metadata; page count preserved
- **DOCX parsing:** `python-docx` extracts paragraph text and table cell content; estimates page count from character density (~2,200 chars/page)
- **Scanned PDF fallback:** If extracted text < 50 characters, `pytesseract` OCR is attempted on PyMuPDF-rasterized pages at 300 DPI
- **Language validation:** `langdetect` rejects non-English documents (English confidence < 0.60)
- **File size limit:** 20 MB max (enforced by FastAPI config; HTTP 413 on violation)
- **Accepted formats:** `.pdf`, `.docx` only; other extensions return HTTP 400

**Validation Errors:**
- `UNSUPPORTED_FORMAT` (400) — wrong file extension
- `UNSUPPORTED_LANGUAGE` (400) — non-English document
- `SCANNED_DOCUMENT_REJECTED` (422) — no selectable text layer and OCR insufficient
- `CORRUPTED_FILE` (422) — password-protected or malformed file

**UI Components:** `UploadZone` (drag-and-drop interface), `ErrorModal` (structured error display)

---

### Feature 3: Automatic Document Type Classification

**What it is:** Before any ML inference runs, the system automatically classifies the uploaded document as a `CONTRACT`, `BILL`, or `UNSUPPORTED` type using a fast regex-based heuristic scan of the document preamble (first 3,000 characters).

**Why it exists:** Contracts and legislative bills have fundamentally different structures. Running CUAD clause extraction on a legislative bill produces meaningless results (bills have no "Payment Terms" or "Indemnity" clauses). The classifier routes documents to the correct summarizer and skips inapplicable analysis steps. Returning an `UNSUPPORTED` label prevents hallucinated outputs for out-of-scope documents (court transcripts, wills, demand letters).

**Output:** `"BILL"` | `"CONTRACT"` | `"UNSUPPORTED"`

---

### Feature 4: AI Clause Extraction (CUAD Categories)

**What it is:** Identification and extraction of verbatim text spans from commercial contracts matching 8 high-risk CUAD benchmark clause categories, with per-clause source location (page number, character offsets).

**Why it exists:** Legal risk in commercial contracts is concentrated in specific clause types. Non-lawyers routinely miss auto-renewal provisions buried in appendices, unilateral indemnity obligations hidden in boilerplate, and liability caps tucked into limitation sections. Extracting and surfacing these clauses explicitly removes the need to read the entire document to find the critical provisions.

**Clause Categories Extracted:**

| Category | What it Identifies | Why It Matters |
|---|---|---|
| **Indemnity** | Obligations to defend, indemnify, and hold harmless another party | Can expose a party to unlimited third-party claims |
| **Termination** | Conditions for terminating the contract (for cause, for convenience, notice windows, cure periods) | Dictates exit rights and obligations upon breach |
| **Auto-Renewal** | Provisions where the agreement automatically extends unless canceled within a notice window | Commonly missed; leads to unwanted multi-year commitments |
| **Confidentiality** | Obligations to protect proprietary and confidential information | Defines what can and cannot be shared |
| **Governing Law** | The jurisdiction and legal framework governing disputes | Determines which courts and laws apply |
| **Limitation of Liability** | Caps on financial damages; waivers of indirect/consequential losses | Limits recovery in the event of breach |
| **Non-Compete / Restrictive Covenants** | Restrictions on competing or soliciting clients/employees | Can restrict future business activities |
| **Payment Terms** | Invoicing cycles, net-X payment windows, late fees, milestone payments | Core commercial obligation; commonly disputed |

**Implementation Details:**
- **Primary:** Fine-tuned RoBERTa QA model on CUAD dataset; sliding window over 350-word chunks; per-category CUAD-style question prompts
- **Fallback:** Deterministic regex + keyword density scoring per CUAD category
- **Confidence threshold:** 0.65 (spans below threshold discarded)
- **IoU deduplication:** Overlapping spans across chunks deduplicated via IoU ≥ 0.5; highest-confidence span kept
- **Page mapping:** Character offset mapped to source page number via `pages_metadata`
- **Output per clause:** `category`, `clause_text` (verbatim excerpt), `page_number`, `description`, `start_char`, `end_char`

**Skipped for:** `BILL` and `UNSUPPORTED` document types.

---

### Feature 5: AI Abstractive Summarization

**What it is:** Generation of a structured, multi-paragraph plain-English summary of the analyzed document. For contracts, the summary covers purpose, parties, payment terms, termination, and restrictive covenants. For bills, it covers identity/title, fiscal impact, key dates, and reporting requirements.

**Why it exists:** Non-lawyers cannot quickly synthesize the key obligations from a dense 20-page MSA. A human-readable, plain-English summary in 3–5 paragraphs condenses the key information and reduces the comprehension burden from 2–4 hours to under 2 minutes.

**Contract Summary (BART Neural / Template Fallback):**
- **Map phase:** Each 500-word chunk summarized abstractively (max 200 tokens, 2 beams, no_repeat_ngram_size=3)
- **Reduce phase:** Chunk summaries concatenated and synthesized into a final executive summary (max 350 tokens, 3 beams)
- **Template fallback:** Constructs structured paragraphs from extracted entities (parties, dates, money, law) and clauses (payment terms, termination, indemnity, liability)
- **4 structured paragraphs:** Parties & Purpose / Financial & Payment Terms / Term & Termination / Liabilities & Covenants

**Bill Summary (BillSummarizer — Template):**
- **4 structured paragraphs:** Bill Identity & Structure / Fiscal Impact & Appropriations / Key Dates & Effective Period / Reporting & Compliance Requirements
- Uses regex signals: short title, enacting clause, section count, title count, appropriation patterns, effective date context, reporting mandates

**Key Takeaways:** 3–5 bullet-point highlights extracted from the summary (financial terms, critical dates, auto-renewal warnings, liability caps, governing jurisdiction)

**Output:** `summary_text`, `key_takeaways[]`, `token_count`, `model_name`, `doc_type`

---

### Feature 6: Named Entity Recognition (NER)

**What it is:** Structured extraction of high-value contract/bill entities — contracting parties, effective dates, monetary amounts, and governing law jurisdictions — displayed in a dedicated entity panel alongside the analysis.

**Why it exists:** The most frequently asked questions when reviewing a contract are: "Who are the parties?", "What are the payment amounts?", "When does this start/end?", and "Which state's laws govern this?" NER surfaces these directly without requiring the user to search the full text.

**Entity Types Extracted:**

| Entity Type | Examples | Source |
|---|---|---|
| `PARTY` | "Acme Corp", "Jane Doe" | spaCy ORG/PERSON + preamble party regex |
| `DATE` | "January 1, 2026", "30 days after written notice" | spaCy DATE/TIME + date regex |
| `MONEY` | "$15,000 USD", "1.5% per month" | spaCy MONEY/PERCENT + money regex |
| `GOVERNING_LAW` | "State of Delaware", "California" | spaCy GPE + governing law regex + known jurisdiction list |

**Implementation Details:**
- spaCy processes first 25,000 characters; regex patterns scan full document
- Deduplication via `seen` set across all extraction passes
- Context window (±35–40 chars) preserved for each entity for in-UI display
- Extraction mode reported: `"full"` (spaCy loaded) or `"reduced"` (regex-only fallback)

---

### Feature 7: Analysis Pipeline Orchestration

**What it is:** A master pipeline coordinator (`AnalyzerPipeline`) that sequences all ML inference steps in the correct order, manages database state transitions, and enforces a hard inference timeout guardrail.

**Why it exists:** The pipeline must atomically coordinate 4 inference steps (classify → extract clauses → extract entities → summarize), persist results to 4 MongoDB collections, handle partial failure cleanly, and prevent zombie database records on timeout. The orchestration layer ensures consistent state management regardless of which inference step fails.

**Pipeline Sequence:**
1. Update document status → `PROCESSING`
2. Classify document type (BILL / CONTRACT / UNSUPPORTED)
3. Extract clauses (skipped for BILL/UNSUPPORTED)
4. Extract entities (runs for all types)
5. Generate summary (type-specific summarizer)
6. Clean old records (for re-analysis)
7. Persist summary, clauses, entities
8. Check for timeout-triggered FAILED status before finalizing
9. Update document status → `COMPLETED`

**Timeout Behavior:** `ThreadPoolExecutor` watchdog hard-kills analysis after `INFERENCE_TIMEOUT_SECONDS` (default 45s); cleans up all partial records; marks document `FAILED`.

---

### Feature 8: Document Analysis Workspace

**What it is:** The primary post-analysis UI — a multi-panel document workspace that displays the full document text alongside the extracted summary, key takeaways, clause badges, and entity table.

**Why it exists:** Presenting all analysis results in a unified, spatial workspace allows users to read the original text while cross-referencing extracted clauses and entities — enabling verification and context without switching views.

**UI Components (from `DocumentWorkspace`):**
- Summary panel with multi-paragraph summary text and bullet takeaways
- Clause badge drawer grouped by CUAD category with verbatim excerpts and page references
- Entity table organized by entity type (PARTY, DATE, MONEY, GOVERNING_LAW)
- Full raw text reader for source verification
- PDF export trigger button
- Document metadata display (filename, page count, file size, doc type, analysis timestamp)
- Re-analysis trigger

---

### Feature 9: Document History Dashboard

**What it is:** A paginated list of all previously analyzed documents for an authenticated user, with summary snippets, metadata, and quick-access to reload any past analysis.

**Why it exists:** Users review multiple contracts over time (ongoing client relationships, vendor renewals). Storing and indexing analysis results eliminates the need to re-run expensive ML inference on documents the user has already analyzed. Users can reference past terms during negotiations.

**Implementation Details:**
- `GET /api/documents?page=N&limit=20` — paginated document list
- Each entry enriched with `summary_snippet` (first 200 chars of summary) and `key_takeaways_count`
- Sorted by `created_at` descending
- `GET /api/documents/{id}` — full document detail retrieval (no inference re-run)
- `DELETE /api/documents/{id}` — hard delete with MongoDB transaction (cascades to summaries, clauses, entities)

**UI Components:** `DocumentHistory` (card list, pagination), `Header` (navigation between upload/history/workspace views)

---

### Feature 10: PDF Analysis Report Export

**What it is:** One-click generation of a professionally formatted, downloadable PDF analysis report containing the executive summary, key takeaways, extracted clauses table, and entity grid.

**Why it exists:** Users need to share analysis results with colleagues, clients, or advisors without granting them platform access. A formatted PDF report provides a portable, shareable, professionally presented artifact of the Amicus analysis.

**Implementation Details:**
- `GET /api/documents/{id}/export` — streams PDF bytes as `application/pdf` attachment
- **Primary renderer:** WeasyPrint (HTML→PDF via Pango/Cairo); full styling with page numbers, branded header, tables
- **Fallback renderer:** PyMuPDF text-based PDF (always available; simpler layout but functional)
- Report includes: Cover page (filename, date, doc type), Executive Summary, Key Takeaways, Extracted Clauses table, Entities grid, Footer disclaimer
- Filename sanitized: `{document_name}_amicus_report.pdf`

---

### Feature 11: Legal Disclaimer & Compliance Guardrails

**What it is:** A system-wide layer of behavioral constraints — persistent UI banners, post-processing text sanitization, and compliance metadata — that ensures Amicus never constitutes legal advice.

**Why it exists:** AI-generated legal analysis creates significant liability if users interpret outputs as legal advice. Regulatory and ethical compliance requires explicit, persistent, and technically-enforced disclaimers. This is not optional — it is a core product requirement.

**Components:**
- `LegalDisclaimerBanner` — persistent, non-dismissible banner on every analysis screen
- `ModelGuardrails` — server-side text sanitization pipeline that detects and neutralizes prohibited phrases (enforceability claims, outcome predictions, prescriptive advice) using regex patterns
- `compliance` payload in every API response: `{ is_legal_advice: false, disclaimer: "...", version: "1.0.0" }`

---

### Feature 12: Document Text Chunking

**What it is:** A token-aware document chunking service that partitions long documents into overlapping, paragraph-boundary-respecting chunks for ML model processing.

**Why it exists:** BART and RoBERTa have fixed context windows (1,024 tokens). Without chunking, documents longer than ~750 words would be silently truncated, causing the model to miss entire contract sections. The chunker ensures complete document coverage while preserving context through overlapping windows.

**Implementation Details:**
- `DocumentChunker.chunk_text()` — paragraph-aware segmentation
- Default: 500 words per chunk, 60-word overlap
- Clause extractor uses 350-word chunks, 50-word overlap
- Each chunk carries `start_char`, `end_char` offsets for page mapping
- Fallback to single-chunk for very short documents

---

## 8. API Surface & Data Model

### 8.1 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ✗ | Register new user; returns JWT token |
| `POST` | `/api/auth/login` | ✗ | Login; returns JWT token |
| `GET` | `/api/auth/me` | ✓ | Get current user profile |
| `POST` | `/api/documents/upload` | ✓ | Upload PDF/DOCX; runs full analysis pipeline; returns complete analysis |
| `POST` | `/api/documents/{id}/analyze` | ✓ | Re-trigger ML analysis on existing document |
| `GET` | `/api/documents` | ✓ | List user documents (paginated, enriched with summary snippets) |
| `GET` | `/api/documents/{id}` | ✓ | Get full document analysis (no inference re-run) |
| `GET` | `/api/documents/{id}/export` | ✓ | Stream PDF analysis report |
| `DELETE` | `/api/documents/{id}` | ✓ | Hard delete document and all analysis records |
| `GET` | `/api/health` | ✗ | Health check endpoint |

### 8.2 MongoDB Collections

```
users
├── _id: ObjectId
├── email: string (unique index)
├── password_hash: string (bcrypt)
├── full_name: string
├── created_at: datetime
└── updated_at: datetime

documents
├── _id: ObjectId
├── user_id: ObjectId → users._id (index)
├── filename: string
├── file_type: string ("application/pdf" | "application/vnd...")
├── file_size_bytes: int
├── page_count: int
├── raw_text_length: int
├── full_text: string (stored for re-analysis)
├── status: string ("PENDING" | "PROCESSING" | "COMPLETED" | "FAILED")
├── error_message: string | null
└── created_at: datetime (index)

summaries  [1:1 with documents]
├── _id: ObjectId
├── document_id: ObjectId → documents._id (unique index)
├── user_id: ObjectId
├── model_name: string ("bart-legal-contract-v1" | "billsum-template-v1" | "unsupported-doc-type")
├── doc_type: string ("BILL" | "CONTRACT" | "UNSUPPORTED")
├── summary_text: string
├── key_takeaways: string[]
├── token_count: int
└── created_at: datetime

extracted_clauses  [1:N with documents]
├── _id: ObjectId
├── document_id: ObjectId → documents._id (index)
├── user_id: ObjectId
├── category: string (CUAD category label)
├── clause_text: string (verbatim excerpt)
├── start_char: int
├── end_char: int
├── page_number: int
├── description: string (clause category explanation)
└── created_at: datetime

extracted_entities  [1:N with documents]
├── _id: ObjectId
├── document_id: ObjectId → documents._id (index)
├── user_id: ObjectId
├── entity_type: string ("PARTY" | "DATE" | "MONEY" | "GOVERNING_LAW")
├── text: string
├── context: string (±40 char window)
└── created_at: datetime
```

---

## 9. Success Metrics & Benchmarks

| Metric | Measured Value | Evaluation Method | Status |
|---|---|---|---|
| **Summarization ROUGE-1** | **43.28%** | Hugging Face `evaluate` on contract test split | ✅ Verified |
| **Summarization ROUGE-2** | **16.83%** | Hugging Face `evaluate` on contract test split | ✅ Verified |
| **Summarization ROUGE-L** | **25.02%** | Hugging Face `evaluate` on contract test split | ✅ Verified |
| **Clause Extraction Precision** | **100.00%** | Micro/Macro average across CUAD test categories | ✅ Verified |
| **Clause Extraction Recall** | **86.67%** | Micro/Macro average across CUAD test categories | ✅ Verified |
| **Clause Extraction F1** | **92.86%** | Macro F1 across Indemnity, Termination, Auto-Renewal, etc. | ✅ Verified |
| **Entity Extraction F1 (NER)** | **88.24%** | Contextual evaluation on test annotations | ✅ Verified |
| **End-to-End Latency (P50)** | **0.147 s** | Standard commercial contract on Render backend | ✅ Benchmarked |
| **End-to-End Latency (P95)** | **1.912 s** | Standard commercial contract on Render backend | ✅ Benchmarked |
| **Document Parsing Success Rate** | ≥ 98.0% | Valid digital PDFs and DOCX files | 🎯 Active Target |

---

## 10. Edge Cases & Failure States

| Edge Case | Trigger | System Behavior |
|---|---|---|
| **Scanned / Image-Only PDF** | `len(extracted_text) < 50` across all pages | OCR fallback attempted (pytesseract at 300 DPI); if OCR yields < 50 chars → HTTP 422 `SCANNED_DOCUMENT_REJECTED` |
| **Non-English Document** | `langdetect` English confidence < 0.60 | HTTP 400 `UNSUPPORTED_LANGUAGE`: "Phase 1 only supports English-language contracts." |
| **Document Exceeds Model Context** | Contract > 750 words | DocumentChunker partitions into 500-word overlapping chunks; Map-Reduce summarization; sliding window clause extraction with IoU deduplication |
| **Malformed / Corrupted File** | Invalid PDF header, password-protected, empty file | PyMuPDF/docx exception caught → HTTP 422 `CORRUPTED_FILE` with actionable error message |
| **Wrong File Format** | `.txt`, `.rtf`, `.jpg`, etc. | HTTP 400 `UNSUPPORTED_FORMAT` |
| **Zero CUAD Clause Matches** | Simple agreements or non-standard contracts | Empty clause array returned; UI displays "No standard high-risk clauses detected" message; summary and entities proceed normally |
| **Inference Timeout** | Analysis exceeds 45 seconds (configurable) | `InferenceTimeoutError` raised; all partial DB records deleted; document status → `FAILED`; client receives 500 error |
| **Unsupported Document Type** | Court transcripts, wills, demand letters | Classifier returns `UNSUPPORTED`; clause extraction and summarizer skipped; static fallback message returned; NER still runs |
| **Re-analysis on Existing Document** | `POST /api/documents/{id}/analyze` | Old summaries, clauses, entities deleted; full pipeline re-runs on stored `full_text` |
| **MongoDB Connection Failure** | Live MongoDB unreachable | Auto-fallback to MongMock in-memory database (development/test only; data non-persistent) |
| **spaCy Model Not Installed** | `en_core_web_sm` missing | Extraction mode set to `"reduced"`; pure regex NER fallback active; no service interruption |
| **BART/RoBERTa Checkpoint Missing** | Model files not found at configured path | Graceful fallback to template summarizer / regex clause extractor; logged as WARNING; no 500 error |

---

## 11. Legal, Compliance & Guardrails

### 11.1 Non-Advisory Disclaimer Requirements

Every screen containing analysis output must display:

> *"Amicus is an AI-powered document analysis tool designed for informational and educational purposes only. Amicus is not a law firm, does not provide legal advice, and does not create an attorney-client relationship. Always consult a qualified attorney for contract review before signing."*

This banner is **persistent** and **non-dismissible** (`LegalDisclaimerBanner` component).

### 11.2 Model Behavioral Guardrails

`ModelGuardrails` applies regex-based post-processing to ALL generated text (summaries and takeaways) before persistence or transmission. Prohibited outputs include:

| Prohibited Pattern | Replacement |
|---|---|
| "this contract is legally binding / enforceable / valid in court" | "The document contains provisions regarding" |
| "is not enforceable / legally null and void" | "contains specific standard terms regarding" |
| "you will win / lose / the court will rule / will hold you liable" | "the document outlines conditions for" |
| "I advise you to / you must strike / you should delete / you should refuse to sign" | "non-lawyer signers commonly note" |
| "this contract is safe to sign / you can safely sign" | "The document outlines agreed terms for review" |

### 11.3 Data Privacy

- **Zero model re-training on user data** — documents are used only for runtime inference
- **User-controlled deletion** — `DELETE /api/documents/{id}` cascades hard-deletes across all 4 collections
- **No third-party data sharing** — all inference runs locally on the backend
- **Ephemeral raw file handling** — file bytes processed in-memory; never written to disk after parsing

---

## 12. Deployment & Infrastructure

### 12.1 Frontend Deployment

- **Platform:** Vercel
- **Build:** `vite build` → static assets in `dist/`
- **Routing:** `vercel.json` rewrite rules for SPA client-side routing
- **Environment:** VITE env vars for API base URL

### 12.2 Backend Deployment

- **Platform:** Render
- **Runtime:** Python 3.11+, Uvicorn ASGI server
- **CORS:** Configured for `localhost:5173`, `localhost:3000`, `*.vercel.app`
- **Compute:** Minimum 4 GB RAM recommended for PyTorch CPU inference
- **Timeout:** 45-second inference timeout guardrail (configurable via `INFERENCE_TIMEOUT_SECONDS`)

### 12.3 Database

- **Production:** MongoDB Atlas (cloud) or self-hosted MongoDB
- **Development/Test:** MongMock in-memory (auto-fallback)

### 12.4 Model Artifacts

| Checkpoint | Path (env configurable) | Fallback |
|---|---|---|
| BART summarizer | `./models/bart-billsum-warmup` | Template summarizer |
| RoBERTa clause extractor | `./models/roberta-cuad-clause-extractor` | Regex extractor |
| spaCy NER | `en_core_web_sm` (pip install) | Regex NER |

---

## 13. Scope: In-Scope vs Out-of-Scope

### 13.1 In-Scope (Phase 1 — Implemented)

- ✅ User authentication (registration, login, JWT, bcrypt)
- ✅ PDF (PyMuPDF) and DOCX (`python-docx`) ingestion up to 20 MB
- ✅ OCR fallback for scanned PDFs (pytesseract)
- ✅ Document type classification (CONTRACT / BILL / UNSUPPORTED)
- ✅ ML clause extraction — 8 CUAD categories (RoBERTa + regex fallback)
- ✅ ML abstractive summarization (BART Map-Reduce + template fallback)
- ✅ NER — Parties, Dates, Money, Governing Law (spaCy + regex)
- ✅ Document history with paginated dashboard
- ✅ PDF export of analysis report (WeasyPrint + PyMuPDF fallback)
- ✅ Legal disclaimer banners and model behavioral guardrails
- ✅ Landing page for marketing/onboarding
- ✅ Inference timeout watchdog with clean database rollback
- ✅ Re-analysis trigger on existing documents

### 13.2 Out-of-Scope (Excluded from Phase 1)

- ❌ **Automated Risk Scoring** — no algorithmic risk score (e.g., "7/10 High Risk"); excluded to avoid false security
- ❌ **Document Comparison / Redlining** — no multi-file version diffing
- ❌ **Clause Negotiation / Rewrite Generator** — no automated alternative clause drafting
- ❌ **E-Signature Integration** — no DocuSign, HelloSign, or native signature execution
- ❌ **Multi-Language Support** — English only in Phase 1
- ❌ **Email Verification** — no email confirmation flow on registration
- ❌ **Password Reset** — no forgot-password / reset flow in Phase 1
- ❌ **Async Processing Queue** — no Celery/RQ/background task queue; synchronous with timeout guardrail
- ❌ **Rate Limiting** — no per-user or per-IP request rate limiting in Phase 1
- ❌ **File Deduplication** — no content-hash deduplication of re-uploaded identical documents

---

## 14. Assumptions & Constraints

1. **Document Language:** All Phase 1 contracts and bills are in English and follow common US/UK/Commonwealth drafting conventions.
2. **File Quality:** Uploaded PDFs are digitally originated or pre-OCRed. Pure image scans are handled via OCR fallback but may degrade NER and clause extraction quality.
3. **Compute Environment:** Render backend instance has minimum 4 GB RAM. PyTorch CPU inference (no GPU) is the primary deployment mode.
4. **Token Limits:** Target contracts average 3–20 pages (1,500–12,000 words). Very long contracts (50+ pages) may experience degraded summary cohesion due to Map-Reduce chunking.
5. **User Competence:** Users can interpret structured summaries and understand basic commercial terminology (net terms, liabilities, indemnity).
6. **Database:** MongoDB Atlas in production; in-memory MongMock acceptable only in development/test.
7. **Model Checkpoints:** Fine-tuned BART and RoBERTa checkpoints must be deployed alongside the backend. If absent, the system degrades gracefully to rule-based fallbacks.

---

## 15. Gaps & Recommendations (Missing from Current Implementation)

These are features and engineering concerns **not currently implemented** that are recommended for inclusion in Phase 1.5 or Phase 2.

### 15.1 Critical Missing Features

| Gap | Priority | Rationale |
|---|---|---|
| **Email Verification on Registration** | 🔴 High | Currently any email can be registered without confirmation, allowing spam/bot accounts and invalid email addresses |
| **Password Reset / Forgot Password** | 🔴 High | No self-service account recovery. Locked-out users have no recovery path |
| **Rate Limiting (API)** | 🔴 High | No per-user or per-IP request throttling; vulnerable to abuse on upload and inference endpoints which are compute-heavy |
| **File Upload Virus/Malware Scanning** | 🔴 High | User-uploaded files are parsed directly without antivirus scanning; ClamAV or cloud scanning recommended |
| **JWT Token Refresh / Revocation** | 🟡 Medium | 24-hour tokens cannot be revoked; no refresh token flow means users must re-login after expiry |
| **Input File Size Validation on Frontend** | 🟡 Medium | Current 20 MB limit is enforced at the server level; client-side pre-validation would improve UX |
| **HTTPS / TLS Enforcement** | 🟡 Medium | Not explicitly enforced in backend config; should be enforced at infrastructure level |

### 15.2 Product Experience Gaps

| Gap | Priority | Rationale |
|---|---|---|
| **Document Re-upload Deduplication** | 🟡 Medium | Same contract uploaded multiple times creates duplicate analysis records; content-hash deduplication would save compute and storage |
| **Analysis Progress Indicator** | 🟡 Medium | No real-time progress feedback during the 1–45 second inference window; polling or WebSocket progress updates would improve UX |
| **Search/Filter in Document History** | 🟡 Medium | History list has no search, filter by date, or filter by doc type — becomes unusable at scale |
| **Clause Confidence Scores in UI** | 🟢 Low | Confidence scores are computed but stripped before storage; surfacing them in the UI would help users gauge extraction reliability |
| **"Clause Not Detected" Status per Category** | 🟡 Medium | PRD specifies explicit "Not Detected" status per CUAD category; current implementation returns an empty array with no per-category status |
| **Bulk Export / Multi-Document Export** | 🟢 Low | No ability to export multiple analyses at once |
| **User Profile Management** | 🟢 Low | No UI for updating name, email, or password |

### 15.3 Security & Compliance Gaps

| Gap | Priority | Rationale |
|---|---|---|
| **MongoDB Encryption at Rest** | 🔴 High | PRD Section 7.3 specifies AES-256 encryption at rest; this requires MongoDB Atlas or self-hosted configuration — not enforced at application level |
| **Audit Logging** | 🟡 Medium | No audit trail for document uploads, deletions, or analysis runs; required for any enterprise/compliance use case |
| **GDPR / CCPA Compliance** | 🟡 Medium | No data export endpoint (GDPR "right to portability"); no formal data retention policy enforced at DB level |
| **Content Security Policy (CSP)** | 🟡 Medium | No CSP headers configured; XSS attack surface on the frontend |
| **Pre-Analysis Acknowledgment Checkbox** | 🟡 Medium | PRD Section 7.1 specifies a first-time upload acknowledgment checkbox; not present in current implementation |

### 15.4 Operational Gaps

| Gap | Priority | Rationale |
|---|---|---|
| **Structured Application Logging / Observability** | 🟡 Medium | Uses Python `logging` module but no structured log aggregation (Datadog, Sentry, Papertrail) |
| **Health Check Enhancement** | 🟢 Low | `/api/health` exists but no deep health check (MongoDB connectivity, model availability status) |
| **Async Background Processing (Celery/RQ)** | 🟢 Low | Synchronous inference blocks the HTTP request thread; for production load, async task queues would improve throughput and resilience |
| **API Versioning** | 🟢 Low | No API versioning (`/api/v1/`); breaking changes would require coordinated frontend/backend deploys |
| **Frontend Error Boundary** | 🟢 Low | No React Error Boundary component to catch unexpected rendering errors gracefully |

---

## 16. Open Questions & Roadmap

### 16.1 Resolved Decisions (Phase 1)

| Decision | Resolution |
|---|---|
| OCR fallback | pytesseract via PyMuPDF pixmap at 300 DPI (synchronous, within inference timeout) |
| Inference architecture | Synchronous CPU inference with 45-second `ThreadPoolExecutor` timeout watchdog |
| NER strategy | Hybrid: spaCy `en_core_web_sm` primary + legal regex patterns fallback |
| Contract summarization | BART Map-Reduce neural (primary) + template synthesis fallback |
| Database | MongoDB with MongMock fallback for dev/test |
| PDF export | WeasyPrint primary + PyMuPDF text-based fallback |

### 16.2 Phase 2 Roadmap

| Feature | Priority |
|---|---|
| Automated Risk Scoring per clause category | 🔴 High |
| Multi-language support (Spanish, French) | 🟡 Medium |
| Document comparison / redlining | 🟡 Medium |
| Clause negotiation / alternative language suggestions | 🟡 Medium |
| E-signature integration (DocuSign / HelloSign) | 🟢 Low |
| Async task queue for large-document processing | 🟡 Medium |
| Fine-grained access sharing (share analysis with advisor) | 🟡 Medium |
| Mobile-responsive PWA | 🟢 Low |

---

*This PRD was generated from a full source code review of the Amicus repository on October 17, 2026. It reflects the actual implemented state of the system and extends the original Phase 1 PRD with missing gaps, corrected tech stack details, and comprehensive feature rationale.*
