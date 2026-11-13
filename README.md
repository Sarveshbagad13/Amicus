# ⚖️ Amicus — AI-Powered Legal Text Analyzer & Contract Intelligence

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Amicus** is an enterprise-grade AI legal contract analysis platform designed to accelerate contract review, surface high-risk commercial clauses, extract legal entities, and produce structured analytical summaries from commercial agreements (PDF & DOCX).

---

## 🚀 Key Features

- **Document Ingestion & OCR Pipeline:** High-fidelity text extraction from PDFs and Word documents (`.docx`), with automated OCR fallback for scanned legal documents via Tesseract and PyMuPDF.
- **Hierarchical Map-Reduce Summarization:** Processes long legal contracts without context truncation using chunking strategies paired with transformer summarization (`facebook/bart-base`).
- **CUAD-Trained Clause Extraction:** Automatically identifies, extracts, and tags standard contractual clauses (Indemnification, Termination, Auto-Renewal, Confidentiality, Governing Law, Limitation of Liability, Non-Compete, Payment Terms).
- **Named Entity Recognition (NER):** Extracts legal contracting parties, execution dates, effective durations, monetary sums, and governing jurisdictions via fine-tuned spaCy and transformer pipelines.
- **Interactive Document Workspace:** React-based split-view interface featuring real-time clause highlighting, risk tagging, entity filtering, and summary inspection.
- **Audit-Ready PDF Export:** Export comprehensive analysis reports formatted with custom styling for executive presentation.
- **Enterprise Security & Privacy:** Stateless parsing options, bcrypt password hashing, JWT authorization, and MongoDB schema validation.

---

## 📁 Repository Structure

```
Amicus/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── routes/           # API Routers (auth, documents, health)
│   │   ├── services/         # Core NLP pipeline, summarizer, clause extractor, NER, parser
│   │   ├── templates/        # PDF export HTML/CSS templates
│   │   ├── utils/            # Standardized API response formatters
│   │   ├── config.py         # App configuration & environment loader
│   │   ├── db.py             # MongoDB connection & index manager (with mongomock fallback)
│   │   └── middleware.py     # JWT authentication & security middleware
│   ├── tests/                # Pytest automated test suite
│   ├── .env.example          # Sample backend environment configuration
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Server entrypoint
├── frontend/                 # React (Vite) Single Page Application
│   ├── src/
│   │   ├── components/       # UI components (analysis, dashboard, landing, upload, layout)
│   │   ├── context/          # React Auth context & session provider
│   │   ├── services/         # Native Fetch API client
│   │   ├── App.jsx           # Main routing & app entry
│   │   └── main.jsx          # React DOM bootstrap
│   ├── .env.example          # Sample frontend environment configuration
│   ├── package.json          # Node dependencies & build scripts
│   ├── tailwind.config.js    # Tailwind styling configuration
│   └── vite.config.js        # Vite build & reverse-proxy configuration
├── scripts/                  # Model evaluation & fine-tuning harnesses
│   ├── evaluate_models.py    # Benchmark harness (ROUGE, F1, P50/P95 latency)
│   ├── evaluation_results.json # Verified baseline benchmark metrics
│   ├── train_billsum_warmup.py # BillSum dataset domain adaptation script
│   └── train_cuad_clause_extraction.py # CUAD clause extraction fine-tuning script
├── docs/                     # Architecture & PRD documentation
├── .gitignore                # Root gitignore (Python, Node, secrets, models)
├── pyrightconfig.json        # Python static type checking configuration
└── README.md                 # Project documentation
```

---

## 🛠️ Prerequisites

- **Python:** 3.10 or higher
- **Node.js:** 18.x or higher (with npm)
- **MongoDB:** Local MongoDB daemon or MongoDB Atlas URI (Note: The backend gracefully falls back to an embedded in-memory database via `mongomock` if MongoDB is not running locally).

---

## ⚙️ Installation & Setup

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download required spaCy language model
python -m spacy download en_core_web_sm

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your preferred configuration (secrets, MongoDB URI, port).

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

---

## 🏃 Running the Application

### Start the Backend Server

```bash
# From within the backend directory (with venv activated)
python run.py
```
The FastAPI backend server will start on `http://127.0.0.1:5000`.  
API documentation is available at `http://127.0.0.1:5000/docs`.

### Start the Frontend Client

```bash
# From within the frontend directory
npm run dev
```
The Vite development server will start on `http://localhost:5173`.

---

## 🧪 Testing & Model Evaluation

### Run Automated Backend Tests

```bash
# From the project root or backend directory
pytest -v backend/tests
```

### Run Model Benchmark Harness

Amicus includes a standardized evaluation suite measuring ROUGE scores for summarization, macro-F1 across CUAD target categories, NER entity metrics, and P50/P95 latency:

```bash
python scripts/evaluate_models.py
```

---

## 🔐 Security & Privacy

- **Zero Secret Ingestion:** All sensitive keys, tokens, and environment parameters are loaded strictly through environment variables.
- **Git Shielding:** The repository includes comprehensive `.gitignore` rules preventing `.env` files, database dumps, model weight binaries, local caches, and private keys from being committed.
- **Safe Fallbacks:** Automated tests utilize mock instances and isolated test namespaces.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

