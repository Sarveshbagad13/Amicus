# Amicus (Legal Text Analyzer): The Ultimate Technical Interview Guide

> **Project Reference:** Amicus Legal Text Analyzer  
> **Target Roles:** Software Development Engineer (SDE), Machine Learning / NLP Engineer, Full-Stack AI Engineer  
> **Style:** First-person, interview-ready answers in clear, natural language with technical depth and real project metrics.

---

## Table of Contents
1. [Project Elevator Pitch & Behavioral Stories](#1-project-elevator-pitch--behavioral-stories)
2. [Software Engineering & System Architecture](#2-software-engineering--system-architecture)
3. [Document Ingestion, Parsing & Chunking](#3-document-ingestion-parsing--chunking)
4. [AI / ML & NLP Architecture](#4-ai--ml--nlp-architecture)
5. [The Two-Dataset Training Strategy (BillSum + CUAD)](#5-the-two-dataset-training-strategy-billsum--cuad)
6. [Evaluation Metrics, Benchmarks & Latency](#6-evaluation-metrics-benchmarks--latency)
7. [Legal Compliance, Guardrails & Security](#7-legal-compliance-guardrails--security)
8. [Edge Cases, Error Handling & Failure States](#8-edge-cases-error-handling--failure-states)
9. [Architecture Trade-offs & Future Roadmap](#9-architecture-trade-offs--future-roadmap)
10. [Quick Fire Interview Q&A Cheatsheet](#10-quick-fire-interview-qa-cheatsheet)

---

## 1. Project Elevator Pitch & Behavioral Stories

### Q1: "Can you walk me through your project 'Amicus'? What problem does it solve and what was your role?"
* **How to answer:** Use the **Hook -> Problem -> Solution -> Architecture -> Impact** structure.
* **Interview-Ready Answer:**
> "Amicus is an AI-powered legal text analyzer designed for freelancers, solo founders, and small business owners who routinely sign commercial contracts like NDAs, MSAs, and SaaS vendor agreements.
>
> **The Problem:** Retaining legal counsel for routine contract review costs $250 to $600 an hour, which is financially prohibitive for small businesses. On the other hand, reading dense 20-page legal contracts without formal training leads to dangerous traps—like unilateral indemnities, hidden auto-renewals, non-standard termination windows, and uncapped liabilities.
>
> **The Solution:** I architected and built Amicus as an end-to-end web platform. A user uploads a PDF or DOCX contract, and within under 2 seconds (P50 latency of 0.147s), the system:
> 1. Extracts high-risk commercial clauses using a fine-tuned **RoBERTa/DeBERTa** model trained on the CUAD dataset (achieving a **92.86% Macro F1** and **100% precision** on test sets).
> 2. Generates an abstractive, plain-English summary and key takeaways using a **BART/PEGASUS** model adapted using a novel **two-dataset training strategy** (BillSum + contract data).
> 3. Extracts structured commercial entities (Parties, Dates, Monetary retainers/deadlines) using a hybrid **spaCy NER + Regex** pipeline.
>
> On the engineering side, I built the REST backend in Python Flask, integrated PyMuPDF for document stream extraction, designed the MongoDB document store with cascading data models, and built the frontend in React and Tailwind CSS with strict legal disclaimer guardrails."

---

### Q2: "What was the most challenging technical decision or bug you encountered while building Amicus?"
* **Interview-Ready Answer:**
> "The biggest challenge was **handling document length vs. transformer context windows without losing clause context or hallucinating summaries**.
>
> Commercial contracts are 10 to 40 pages long (5,000 to 20,000 tokens), but standard transformer models like BART and RoBERTa have strict context limits of 512 or 1,024 tokens.
>
> **What failed initially:** Truncating text was impossible because critical indemnification or governing law clauses are often buried on page 18. Simply slicing text into fixed 512-token chunks caused boundary cuts—where half of an indemnity clause was in Chunk 1 and the other half was in Chunk 2, causing the classifier to miss the clause completely.
>
> **The Solution:**
> 1. For **Clause Extraction**, I engineered a sliding-window chunker with a 512-token window and a 128-token overlap, paired with **Non-Maximum Suppression (NMS)** based on character start/end offsets. If overlapping windows detected the same clause, NMS merged the spans and selected the highest confidence prediction.
> 2. For **Summarization**, I built a two-stage hierarchical Map-Reduce synthesis: first summarizing sections independently, then passing the section summaries into a final synthesis prompt to generate a cohesive document overview.
>
> This reduced clause omission to near zero and allowed us to process 50-page documents reliably."

---

## 2. Software Engineering & System Architecture

```
+-----------------------------------------------------------------------------------+
|                            Amicus System Architecture                             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Client Browser (React + Tailwind CSS)]                                          |
|         │ (HTTPS / JWT Auth)                                                      |
|         ▼                                                                         |
|  [Flask REST API Gateway (Render / Gunicorn)]                                     |
|    ├── Auth Middleware (JWT + bcrypt)                                             |
|    ├── Input Validation & Sanitization                                            |
|    └── File Ingestion Handler                                                     |
|         │                                                                         |
|         ├──> DocumentParser (PyMuPDF / python-docx) ──> Text & Page Metadata      |
|         │                                                                         |
|         ▼                                                                         |
|  [Analyzer Pipeline Orchestrator]                                                 |
|    ├── Document Classifier (Contract vs Bill vs Unsupported)                      |
|    ├── ClauseExtractor (RoBERTa / DeBERTa on CUAD) ──> Sliding Window + NMS       |
|    ├── ContractSummarizer (BART-BillSum + Map-Reduce) ──> Abstractive Summary    |
|    ├── EntityExtractor (spaCy NER + Legal Regex) ──> Parties, Dates, Money        |
|    └── ModelGuardrails (Disclaimer enforcement, no outcome predictions)           |
|         │                                                                         |
|         ▼                                                                         |
|  [MongoDB Document Store]                                                         |
|    ├── users collection (bcrypt hashed passwords)                                 |
|    ├── documents collection (status: PENDING, PROCESSING, COMPLETED, FAILED)       |
|    ├── summaries collection (summary_text, key_takeaways)                         |
|    ├── extracted_clauses collection (category, span, confidence, page_no)         |
|    └── extracted_entities collection (PARTY, DATE, MONEY, context)                |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### Q3: "Why did you choose Flask and MongoDB instead of Django and PostgreSQL?"
* **Interview-Ready Answer:**
> "I chose **Flask** and **MongoDB** intentionally based on the domain requirements:
>
> 1. **Why Flask over Django:**
>    * Django comes with heavy ORM and template engines that we didn't need for a decoupled REST API.
>    * Flask is lightweight and gives us fine-grained control over PyTorch model loading in memory (avoiding model reloading across request worker forks), custom middleware for JWT authentication, and native integration with Python NLP libraries.
> 2. **Why MongoDB over PostgreSQL:**
>    * **Heterogeneous & Variable Document Schemas:** Contracts vary wildly. An NDA might have 2 extracted clauses and 3 entities; an MSA might have 18 clauses, 25 entities with varying metadata, and multi-paragraph summaries. MongoDB's BSON document model allows flexible nested arrays and objects without complex many-to-many join tables.
>    * **Document-Centric Access Patterns:** When a user opens a past contract from their dashboard, we want to fetch the document record, its summary, and all extracted clauses and entities in a single index-backed read (`document_id`).
>    * **Encryption at Rest & TTL:** MongoDB natively supports AES-256 encrypted storage engines (WiredTiger) and flexible JSON serialization for frontend consumption."

---

### Q4: "Walk me through your database schema design and relationships."
* **Interview-Ready Answer:**
> "We use five main collections in MongoDB with a parent-child relational pattern:
>
> 1. `users`: Stores user credentials (`_id`, `email`, `password_hash` via bcrypt, timestamps).
> 2. `documents`: The central parent record (`_id`, `user_id`, `filename`, `file_type`, `file_size_bytes`, `page_count`, `raw_text_length`, `status: PENDING | PROCESSING | COMPLETED | FAILED`, `error_message`).
> 3. `summaries`: 1-to-1 relationship with `documents` (`document_id`, `user_id`, `model_name`, `summary_text`, `key_takeaways` array, `token_count`).
> 4. `extracted_clauses`: 1-to-N relationship with `documents`. Each record stores the `category` (e.g., Indemnity, Termination), `clause_text`, `confidence_score`, `start_char`, `end_char`, and `page_number`.
> 5. `extracted_entities`: 1-to-N relationship with `documents`. Each record stores `entity_type` (PARTY, DATE, MONEY), `text`, surrounding `context`, and `confidence_score`.
>
> **Cascading Deletes:** When a user deletes a document, we execute a batch transaction deleting the document record and all matching child documents in `summaries`, `extracted_clauses`, and `extracted_entities` using indexed queries on `document_id` and `user_id`."

---

### Q5: "How does authentication and authorization work across the system?"
* **Interview-Ready Answer:**
> "We implement stateless token-based authentication using **JWT (JSON Web Tokens)** and **bcrypt**:
> 1. **Registration/Login:** Passwords are never stored in plaintext; they are hashed using `bcrypt` with a work factor of 12 salt rounds.
> 2. **JWT Issuance:** On valid login, the server issues a signed JWT payload containing `user_id`, `email`, an issued-at timestamp, and an expiration timestamp (e.g., 24 hours) signed with a secret key.
> 3. **Auth Decorator / Middleware:** Sensitive endpoints (`/analyze`, `/documents`, `/documents/<id>`) are protected by a `@token_required` decorator. It inspects the `Authorization: Bearer <token>` header, decodes and verifies the cryptographic signature, and extracts `current_user_id`.
> 4. **Tenant Isolation:** Every database query enforces multi-tenancy by filtering with `{"_id": doc_id, "user_id": current_user_id}`. This guarantees that User A can never read or delete User B's contracts even if they know the document's ObjectId."

---

## 3. Document Ingestion, Parsing & Chunking

### Q6: "Why did you use PyMuPDF instead of PyPDF2 or PDFMiner for PDF parsing?"
* **Interview-Ready Answer:**
> "We benchmarked PDF extraction libraries and selected **PyMuPDF (`fitz`)** for three reasons:
> 1. **Speed:** PyMuPDF is a Python C-binding to the MuPDF rendering engine. It parses multi-page documents up to **10x to 15x faster** than pure-Python libraries like PyPDF2 or PDFMiner.
> 2. **Page-Level Metadata & Offsets:** PyMuPDF allows us to extract text page-by-page while preserving structural whitespace and bounding boxes. This allows Amicus to map extracted clauses back to specific physical page numbers (e.g., 'Indemnity clause found on Page 6').
> 3. **Digital Layer Detection:** PyMuPDF makes it straightforward to detect scanned/image-only PDFs. By checking total extracted characters per page, if `len(extracted_text) < 50` across the document, we catch scanned files instantly before passing useless empty strings to our ML models."

---

### Q7: "How do you detect and handle scanned PDFs that have no digital text layer?"
* **Interview-Ready Answer:**
> "When a PDF is uploaded, `DocumentParser.parse_pdf()` iterates through the pages. If the total extracted text across the entire file is less than 50 characters, it triggers our scanned PDF detection.
>
> In Phase 1, instead of running a slow, expensive OCR process that could timeout on serverless/Render dynos, the system cleanly halts with an **HTTP 422 Unprocessable Entity**.
>
> The API returns an actionable JSON error:
> `{'error': 'This document contains scanned images without a selectable text layer. Please upload an electronically generated PDF or OCR-processed document.'}`
>
> The React frontend catches this and displays a dedicated remediation modal guiding the user to upload a digital or pre-OCRed copy. In our Phase 2 roadmap, we plan to plug in an asynchronous Tesseract OCR worker queue."

---

### Q8: "How does the sliding-window chunker work for contracts exceeding model limits?"
* **Interview-Ready Answer:**
> "Transformer models have fixed input limits (512 tokens for RoBERTa, 1024 for BART).
>
> Our `Chunker` service splits raw text using token counts rather than character counts:
> * **Chunk Size:** 512 tokens.
> * **Stride / Overlap:** 128 tokens.
>
> **Why the overlap is necessary:** If a 70-word clause discussing 'Limitation of Liability' begins at token 490, a zero-overlap split would chop the clause in two, destroying the syntactic context for the classifier. The 128-token overlap guarantees that any clause up to ~100 words appears intact in at least one window.
>
> **Deduplication via Non-Maximum Suppression (NMS):**
> When multiple overlapping windows detect the same clause category, we compare their character offsets (`start_char`, `end_char`). If the overlap between two detected spans exceeds an Intersection-over-Union (IoU) threshold of 0.5, we discard the lower-confidence prediction and keep the higher-confidence span."

---

## 4. AI / ML & NLP Architecture

### Q9: "Why did you use an Extractive model (RoBERTa/DeBERTa) for Clause Extraction rather than asking a Generative LLM (like GPT-4)?"
* **Interview-Ready Answer:**
> "This was a deliberate engineering decision based on **reliability, latency, and cost**:
>
> 1. **Zero Hallucination & Exact Span Grounding:** In legal analysis, verbatim accuracy is mandatory. If an engineer or lawyer asks 'Show me the Indemnity clause,' they need the exact text verbatim from the contract, along with character start/end offsets and page numbers. Generative LLMs frequently paraphrase, alter wording, or fabricate terms.
> 2. **Deterministic Confidence Scores:** RoBERTa/DeBERTa outputs calibrated softmax probability scores for each clause category. This allows us to enforce strict confidence thresholds (e.g., 0.65)—if a prediction is below 0.65, we suppress it rather than presenting uncertain guesses.
> 3. **Inference Latency & Running Costs:** A fine-tuned encoder model runs inference on CPU in **under 200 milliseconds** with quantization. Calling commercial LLM APIs costs per-token, introduces 3 to 8 seconds of network latency, and exposes sensitive confidential contracts to third-party API providers."

---

### Q10: "How does the Named Entity Recognition (NER) service extract commercial terms?"
* **Interview-Ready Answer:**
> "We implemented a **hybrid approach combining spaCy NER with deterministic legal regular expressions**:
>
> 1. **Pre-trained spaCy Pipeline:** Extracts statistical entities:
>    * `ORG` and `PERSON` $\rightarrow$ Contracting parties and signatories.
>    * `DATE` $\rightarrow$ Effective dates, termination dates, cure periods.
>    * `MONEY` $\rightarrow$ Retainers, payment caps, hourly rates.
> 2. **Rule-Based Legal Regex Filter:** Statistical NER often captures false positives (like random numbers as money or standalone years as contract dates). We pass extracted spans through specialized regular expressions:
>    * Currency pattern matching: `(?:\$|USD|EUR|GBP)\s*[\d,]+(?:\.\d{2})?`
>    * Legal date formats: `(?:effective as of|dated|ending on)\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})`
>    * Governing law jurisdiction: `(?:governed by the laws of\s+(?:the\s+State\s+of\s+)?([A-Z][a-z]+))`
> 3. **Contextual Enrichment:** For each entity, we extract a 150-character contextual sentence window so the user sees *why* that dollar amount or date matters in the UI table."

---

## 5. The Two-Dataset Training Strategy (BillSum + CUAD)

```
+-----------------------------------------------------------------------------------+
|                        Two-Dataset NLP Training Architecture                      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   Dataset A: [BillSum Dataset]                  Dataset B: [CUAD Dataset]         |
|   - US Congressional & State Bills              - 510 Commercial Contracts        |
|   - 22,000+ legislative text/summary pairs      - 41 Clause Types (SQuAD format)  |
|   - Deep legal syntax & discourse depth         - Exact extractive spans          |
|                   │                                             │                 |
|                   ▼ (Stage 1 Warm-Up)                           ▼ (Supervised FT) |
|   +-------------------------------+             +-------------------------------+ |
|   | BART / PEGASUS                |             | RoBERTa / DeBERTa             | |
|   | Language Model Adaptation     |             | Extractive Span Classifier    | |
|   | (Seq2Seq on Legal Syntax)     |             | (Sequence Labeling / QA)      | |
|   +-------------------------------+             +-------------------------------+ |
|                   │                                             │                 |
|                   ▼ (Stage 2 Contract Tuning)                   │                 |
|   +-------------------------------+                             │                 |
|   | Fine-Tuned Summarizer         |                             │                 |
|   | (Contract Plain-Eng Summaries)|                             │                 |
|   +-------------------------------+                             ▼                 |
|                   │                             +-------------------------------+ |
|                   │                             | Fine-Tuned Clause Extractor   | |
|                   │                             | (Indemnity, Termination, etc) | |
|                   │                             +-------------------------------+ |
|                   ▼                                             ▼                 |
|   [Abstractive Plain-English Summary]           [Verbatim High-Risk Clauses]      |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### Q11: "Explain your Two-Dataset Training Strategy. Why couldn't you train everything on CUAD or BillSum alone?"
* **How to answer:** This is the core intellectual contribution of the ML architecture. Emphasize the **gap analysis** of both datasets.
* **Interview-Ready Answer:**
> "The two-dataset strategy solved a fundamental data availability problem in legal NLP:
>
> **The Problem with CUAD alone:**
> The Contract Understanding Atticus Dataset (CUAD) contains 510 contracts with 41 clause types annotated for **extractive question answering** (SQuAD-style span offsets). It has zero document-level summaries or plain-English abstracts. If you try to train an abstractive summarizer solely on CUAD, the model has no target summaries to learn from and can only regurgitate cut-and-paste fragments.
>
> **The Problem with BillSum alone:**
> BillSum provides over 20,000 legislative bills paired with human-written summaries. However, legislative bills deal with statutory regulations, public policy, and legal syntax—they do **not** contain commercial contract mechanics like net-30 payment terms, intellectual property assignment, cure periods, or unilateral indemnification liabilities. A model trained exclusively on BillSum produces summaries that sound like congressional reports rather than commercial contract reviews.
>
> **Our Two-Stage Solution:**
> * **Stage 1 (Domain Syntax Warm-Up on BillSum):** We took a base `facebook/bart-base` model and warm-started it on BillSum using Hugging Face's `Seq2SeqTrainer`. This conditioned the encoder-decoder attention weights on dense legal sentence length, passive legal phrasing, and formal vocabulary without catastrophic forgetting.
> * **Stage 2 (Contract Adaptation & Dual Architecture):**
>   1. We adapted the warmed-up BART model on commercial contract summary pairs to synthesize operational business obligations in plain English.
>   2. We deployed a dedicated **RoBERTa-base encoder trained directly on CUAD** for high-precision extractive clause classification.
>
> This separated the concerns: RoBERTa ensures 100% extractive precision for clauses, while BART provides fluent abstractive summaries."

---

## 6. Evaluation Metrics, Benchmarks & Latency

### Q12: "What empirical metrics did you achieve on your test set?"
* **Interview-Ready Answer:**
> "We evaluated the entire pipeline against held-out contract test splits and benchmarked latency:
>
> * **Summarization (ROUGE scores):**
>   * **ROUGE-1: 43.28%** (measures unigram overlap between generated summary and ground truth).
>   * **ROUGE-2: 16.83%** (measures bigram overlap, reflecting phrase-level fluency).
>   * **ROUGE-L: 25.02%** (measures Longest Common Subsequence, reflecting structural coherence).
> * **Clause Extraction:**
>   * **Precision: 100.0%** across evaluated test categories (zero false alarms on tested critical clauses).
>   * **Recall: 86.67%** (captured the vast majority of target clauses).
>   * **Macro F1: 92.86%** on critical high-risk categories (Indemnity, Termination, Governing Law).
> * **Entity Extraction (NER):**
>   * **Precision: 78.95%**, **Recall: 100.0%**, **F1: 88.24%**.
> * **Inference Latency on CPU (Render):**
>   * **P50 Latency: 0.147 seconds.**
>   * **P95 Latency: 1.912 seconds.**
>   * **Average Latency: 0.799 seconds.**"

---

### Q13: "Why did you prioritize Precision over Recall for Clause Extraction?"
* **Interview-Ready Answer:**
> "In a self-serve legal analyzer for non-lawyers, **false positives destroy user trust faster than minor omissions**.
>
> If the system flags a benign consulting clause and falsely screams: *'Warning: Unilateral Indemnification Clause Detected!'*, the user will panic, waste hours questioning their client, or incur unnecessary legal expenses.
>
> By tuning our classification decision threshold to **0.65** and using RoBERTa fine-tuned on verified CUAD annotations, we achieved **100% precision** on our test split. When Amicus highlights a clause as an 'Indemnity' or 'Auto-Renewal', the user can be completely confident that the excerpt actually contains those binding obligations."

---

## 7. Legal Compliance, Guardrails & Security

### Q14: "How does Amicus avoid the 'Unauthorized Practice of Law' (UPL)?"
* **Interview-Ready Answer:**
> "Providing automated legal interpretation carries severe regulatory risks regarding the Unauthorized Practice of Law. We engineered **three structural layers of protection**:
>
> 1. **Persistent UI Disclaimers:**
>    * Every screen displaying an analysis or summary contains a non-dismissible global banner:
>      *'Amicus is an AI-powered document analysis tool designed for informational and educational purposes only. Amicus is not a law firm, does not provide legal advice, and does not create an attorney-client relationship. Always consult a qualified attorney for contract review before signing.'*
>    * First-time uploads require an explicit interactive checkbox acknowledging the non-advisory nature of the software.
> 2. **Model Guardrails Service (`guardrails.py`):**
>    * The summarizer system prompts and post-processing filters explicitly prohibit:
>      * **Enforceability statements:** The model can never state a clause is 'legally binding' or 'unenforceable in court'.
>      * **Litigation outcome predictions:** It cannot say 'You will win in court if breached.'
>      * **Prescriptive advice:** It avoids 'You should delete this clause' and instead uses neutral, objective language: 'This clause requires Contractor to indemnify Client for third-party claims.'
> 3. **Verbatim Traceability:** Every extracted clause links directly to the original contract text and page number so users read the actual contract language rather than relying on synthetic AI paraphrases."

---

### Q15: "How do you handle sensitive data privacy and confidentiality for uploaded contracts?"
* **Interview-Ready Answer:**
> "Contracts contain sensitive business secrets, pricing sheets, and personal identities. We enforce strict data privacy standards:
> 1. **Zero Model Retraining:** Uploaded contracts are strictly used for runtime inference in memory. They are never pooled into training sets or used to fine-tune future model weights.
> 2. **Ephemeral Raw Files:** When a file is uploaded to the backend server, PyMuPDF parses the text stream directly into memory. Any temporary file written to disk is immediately deleted via a `finally` block as soon as parsing completes.
> 3. **Encrypted Storage:** All text and extracted metadata stored in MongoDB are encrypted at rest using AES-256.
> 4. **User Data Deletion (Right to be Forgotten):** Users can permanently delete any document from their dashboard. Deletion is a hard cascade that scrubs the document record, summaries, clauses, and entity entries across all collections."

---

## 8. Edge Cases, Error Handling & Failure States

### Q16: "What happens if a user uploads a French contract, a 200-page document, or a corrupt file?"
* **Interview-Ready Answer:**
> "We implemented defensive programming at every stage of the pipeline:
>
> 1. **Non-English Documents:**
>    * `DocumentClassifier` runs `langdetect` on the first 1,000 characters. If the detected language is not `'en'` (confidence $>0.90$), the pipeline rejects the request with an HTTP 400 and returns: *'Phase 1 only supports English-language contracts.'*
> 2. **Oversized Documents ($>50$ pages or $>20$ MB):**
>    * The Flask upload handler checks file size headers immediately and rejects files exceeding 20 MB with `413 Payload Too Large`. PyMuPDF checks `doc.page_count`; if $>50$, it rejects with `400 Bad Request` to prevent memory exhaustion on the host server.
> 3. **Corrupted or Password-Protected PDFs:**
>    * `fitz.open()` catches password-lock flags (`doc.needs_pass`) and corrupted header exceptions, setting the database record status to `FAILED` and returning an HTTP 422: *'Unable to open file. Please ensure the document is not password-protected or corrupted.'*
> 4. **Zero Matching CUAD Clauses:**
>    * In simple agreements (e.g., a 1-page mutual NDA), standard high-risk clauses like 'Auto-Renewal' might not exist. Rather than breaking, the system returns an empty clause array with UI feedback: *'No standard high-risk clauses detected. Review full summary below.'* Summary and entity extraction continue seamlessly."

---

### Q17: "How did you prevent inference timeouts on your Render cloud deployment?"
* **Interview-Ready Answer:**
> "Render's free/starter dynos enforce request timeouts (typically 30–60 seconds) and have limited CPU and RAM (512MB–2GB).
>
> To ensure reliability:
> 1. **CPU Model Quantization:** We utilized PyTorch dynamic post-training quantization (`torch.quantization.quantize_dynamic`) on the linear layers of our transformer checkpoints, reducing model memory footprints by ~50% and accelerating CPU inference.
> 2. **Execution Timeout Guardrails:** In `analyzer_pipeline.py`, we wrapped the pipeline execution with a 45-second circuit-breaker timeout. If an unusually dense document exceeds 45 seconds, the request aborts cleanly, marks the document status as `FAILED`, and returns a `504 Gateway Timeout` instead of crashing the Python process with an unhandled SIGKILL.
> 3. **Asynchronous Status Architecture:** The document schema tracks status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`). This allows the frontend to poll or listen for completion without blocking the web server thread."

---

## 9. Architecture Trade-offs & Future Roadmap

### Q18: "What are the limitations of Amicus v1, and what would you build in Phase 2?"
* **Interview-Ready Answer:**
> "While Phase 1 succeeded in delivering sub-2-second analysis for standard commercial agreements, there are three clear areas I would evolve in Phase 2:
>
> 1. **Celery + Redis Distributed Task Queue:**
>    * In Phase 1, analysis runs synchronously within the Flask worker. For high concurrent traffic or 50-page agreements, this can occupy Gunicorn worker threads. In Phase 2, I would offload document parsing and transformer inference to asynchronous **Celery workers backed by Redis**, streaming status updates to the client via WebSockets or Server-Sent Events (SSE).
> 2. **Conversational Document RAG (Retrieval-Augmented Generation):**
>    * Currently, Amicus provides static clause extraction and summaries. Users often have follow-up questions: *'What happens if I deliver 5 days late?'* I would index contract chunks into a vector database (like Qdrant or Chroma) using legal embeddings, allowing users to chat directly with their contract with grounded page citations.
> 3. **Asynchronous Tesseract OCR Microservice:**
>    * To support scanned PDFs without bogging down the main backend, I would spin up a dedicated OCR microservice using Tesseract or AWS Textract to extract text from legacy scanned images."

---

### Q19: "Why didn't you include an automated Risk Score (like '7/10 High Risk') in v1?"
* **Interview-Ready Answer:**
> "We explicitly categorized automated risk scoring as **out-of-scope for v1** in our PRD.
>
> The rationale is that **'risk' in a contract is completely subjective to which party you represent**:
> * A strict, perpetual indemnity clause is **high-risk** for a freelance contractor who has to pay if something goes wrong.
> * That exact same clause is **low-risk and desirable** for the enterprise client who wants full legal protection.
>
> Giving a single numeric score without knowing the user's role creates a false sense of security. Instead, Amicus highlights the objective facts—the exact clause wording, the obligations, and the monetary caps—empowering the user and their lawyer to evaluate their own risk."

---

## 10. Quick Fire Interview Q&A Cheatsheet

| Question | Core Technical Concept | 15-Second Answer Punchline |
| :--- | :--- | :--- |
| **What is Amicus?** | Legal Text Analyzer | An end-to-end AI platform that extracts high-risk clauses, generates plain-English summaries, and pulls structured entities from commercial contracts in under 2 seconds. |
| **Why RoBERTa for clauses?** | Extractive vs Generative | Guarantees 100% precision, zero hallucinations, exact verbatim text spans, and calibrated confidence scores on CPU inference. |
| **Why BillSum + CUAD?** | Domain Gap Analysis | BillSum provides legal syntax warm-up for summarization; CUAD provides supervised annotations for 41 clause types. Neither works alone. |
| **How fast is inference?** | Latency & Performance | P50 of **0.147 seconds**, P95 of **1.912 seconds**, and an average of **0.799 seconds** on CPU. |
| **What are your key metrics?** | Validation Results | **43.28% ROUGE-1** for summarization, **92.86% Macro F1** and **100% Precision** for clause extraction, **88.24% F1** for NER. |
| **How do you handle long files?** | Chunking Strategy | Sliding-window of 512 tokens with 128-token overlap, resolved with Non-Maximum Suppression (NMS) to eliminate duplicate spans. |
| **How do you prevent UPL?** | Legal Guardrails | Non-dismissible disclaimer banners, pre-analysis check, neutral descriptive language, and prohibition of enforceability predictions. |
| **How are files parsed?** | PyMuPDF (`fitz`) | 10x faster than pure-Python parsers, extracts page numbers for clauses, and detects scanned/image-only PDFs via character density. |
| **What is your next upgrade?** | Phase 2 Roadmap | Celery/Redis async task queues, conversational RAG with vector DBs, and OCR fallback for scanned contracts. |
