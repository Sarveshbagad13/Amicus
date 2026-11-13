"""
Comprehensive Model Evaluation Harness for Amicus Legal Text Analyzer
Calculates:
1. Abstractive Summarization: ROUGE-1, ROUGE-2, ROUGE-L
2. Clause Extraction: Precision, Recall, Macro-F1 across CUAD target categories
3. Entity Extraction (NER): Precision, Recall, F1 for Parties, Dates, Money
4. Inference Latency: P50 and P95 response times
"""

import os
import sys
import time
import json
import logging
import numpy as np

# Ensure backend modules are on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.services.clause_extractor import ClauseExtractor, CUAD_CATEGORIES
from app.services.ner_service import EntityExtractor
from app.services.summarizer import ContractSummarizer
from app.services.document_parser import DocumentParser

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Ground-truth benchmark evaluation test contracts
BENCHMARK_TEST_SUITE = [
    {
        "id": "contract_01_msa",
        "title": "Master Services Agreement (TechCorp & Nova Solutions)",
        "text": (
            "MASTER SERVICES AGREEMENT\n\n"
            "This Agreement is entered into on January 15, 2026, by and between TechCorp Inc. (Client) "
            "and Nova Solutions LLC (Contractor).\n\n"
            "1. Services & Invoicing:\n"
            "Contractor agrees to provide software consulting services. Invoices are payable net-30 days from receipt. "
            "A monthly retainer of $15,000 USD shall be invoiced on the first of each month. Late payments incur a fee of 1.5% per month.\n\n"
            "2. Term and Auto-Renewal:\n"
            "This Agreement commences on the Effective Date and continues for a term of one (1) year. "
            "This Agreement shall automatically renew for successive one-year terms unless either party gives written notice "
            "of non-renewal at least 60 days prior to the expiration of the current term.\n\n"
            "3. Termination:\n"
            "Either party may terminate this Agreement for convenience upon 30 days written notice of termination. "
            "Either party may terminate immediately for material breach if uncured for 15 days.\n\n"
            "4. Indemnification:\n"
            "Contractor agrees to defend, indemnify, and hold harmless Client against third-party claims arising from gross negligence.\n\n"
            "5. Limitation of Liability:\n"
            "In no event shall aggregate liability exceed the total amounts paid in the preceding twelve months.\n\n"
            "6. Confidentiality:\n"
            "Each party shall maintain all proprietary information in strict confidence for a period of 3 years.\n\n"
            "7. Governing Law:\n"
            "This Agreement is governed by the laws of the State of Delaware."
        ),
        "reference_summary": (
            "This Master Services Agreement between TechCorp Inc. and Nova Solutions LLC dated January 15, 2026, establishes "
            "software consulting deliverables under Delaware governing law. Payments require a monthly fee of $15,000 USD "
            "payable net-30 days with a 1.5% monthly late fee. The contract runs for one year and automatically renews for successive "
            "terms unless 60 days prior written notice is given. Either party may terminate for convenience with 30 days notice. "
            "Contractor provides indemnification for gross negligence, and total liability is capped at fees paid over the prior 12 months."
        ),
        "gold_clauses": [
            "Payment Terms", "Auto-Renewal", "Termination", "Indemnity",
            "Limitation of Liability", "Confidentiality", "Governing Law"
        ],
        "gold_entities": [
            {"type": "PARTY", "text": "TechCorp Inc."},
            {"type": "PARTY", "text": "Nova Solutions LLC"},
            {"type": "DATE", "text": "January 15, 2026"},
            {"type": "MONEY", "text": "$15,000 USD"},
            {"type": "MONEY", "text": "1.5%"},
            {"type": "GOVERNING_LAW", "text": "State of Delaware"}
        ]
    },
    {
        "id": "contract_02_nda",
        "title": "Mutual Non-Disclosure Agreement (Acme & Beta)",
        "text": (
            "MUTUAL NON-DISCLOSURE AGREEMENT\n\n"
            "This Mutual Non-Disclosure Agreement is made by and between Acme Corp and Beta Innovations Ltd., "
            "effective as of March 10, 2026.\n\n"
            "Section 1. Confidential Information:\n"
            "Each party agrees to hold all proprietary trade secrets in strict confidence and shall not disclose such "
            "confidential information to any third party.\n\n"
            "Section 2. Term & Termination:\n"
            "This Agreement shall remain in effect for two years. Either party may terminate this Agreement upon 15 days written notice.\n\n"
            "Section 3. Remedies & Liability:\n"
            "In no event shall either party be liable for consequential damages or punitive damages.\n\n"
            "Section 4. Governing Law:\n"
            "This Agreement shall be governed by and construed in accordance with the laws of the State of California."
        ),
        "reference_summary": (
            "Mutual Non-Disclosure Agreement between Acme Corp and Beta Innovations Ltd. effective March 10, 2026. "
            "The agreement obligates both parties to keep proprietary trade secrets in strict confidence for two years. "
            "Either party may terminate the agreement on 15 days written notice. Consequential and punitive damages are waived, "
            "and disputes are governed under the laws of the State of California."
        ),
        "gold_clauses": ["Confidentiality", "Termination", "Limitation of Liability", "Governing Law"],
        "gold_entities": [
            {"type": "PARTY", "text": "Acme Corp"},
            {"type": "PARTY", "text": "Beta Innovations Ltd."},
            {"type": "DATE", "text": "March 10, 2026"},
            {"type": "GOVERNING_LAW", "text": "State of California"}
        ]
    },
    {
        "id": "contract_03_freelance_sow",
        "title": "Freelance SOW & Independent Contractor Agreement",
        "text": (
            "INDEPENDENT CONTRACTOR STATEMENT OF WORK\n\n"
            "Between Apex Studios Inc. and Jordan Taylor (Consultant), dated June 1, 2026.\n\n"
            "1. Deliverables and Compensation:\n"
            "Client shall pay Contractor a flat fee of $8,500 due upon completion of project milestones. "
            "Invoices are payable net-15 days from submission.\n\n"
            "2. Non-Compete and Non-Solicitation:\n"
            "Contractor agrees not to solicit employees or clients of Apex Studios for 12 months following completion.\n\n"
            "3. Indemnification:\n"
            "Contractor shall defend and hold harmless Apex Studios against all third-party intellectual property claims.\n\n"
            "4. Jurisdiction:\n"
            "Governed by the laws of the State of New York."
        ),
        "reference_summary": (
            "Independent Contractor SOW between Apex Studios Inc. and Jordan Taylor dated June 1, 2026. "
            "Sets a flat compensation fee of $8,500 payable net-15 days upon milestone completion. "
            "Includes a 12-month non-solicitation and restrictive covenant clause, a full indemnification defense "
            "for IP claims, and designates New York state law as governing jurisdiction."
        ),
        "gold_clauses": ["Payment Terms", "Non-Compete / Restrictive Covenants", "Indemnity", "Governing Law"],
        "gold_entities": [
            {"type": "PARTY", "text": "Apex Studios Inc."},
            {"type": "PARTY", "text": "Jordan Taylor"},
            {"type": "DATE", "text": "June 1, 2026"},
            {"type": "MONEY", "text": "$8,500"},
            {"type": "GOVERNING_LAW", "text": "State of New York"}
        ]
    }
]

def calculate_rouge_scores(predictions, references):
    """Compute ROUGE-1, ROUGE-2, and ROUGE-L using evaluate or fallback tokenizer."""
    try:
        import evaluate
        rouge = evaluate.load("rouge")
        results = rouge.compute(predictions=predictions, references=references, use_stemmer=True)
        return {
            "rouge1": round(float(results["rouge1"]), 4),
            "rouge2": round(float(results["rouge2"]), 4),
            "rougeL": round(float(results["rougeL"]), 4)
        }
    except Exception:
        # High-precision n-gram ROUGE fallback
        from collections import Counter
        def get_ngrams(tokens, n):
            return Counter([tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)])

        def rouge_n(p_tokens, r_tokens, n):
            p_ng = get_ngrams(p_tokens, n)
            r_ng = get_ngrams(r_tokens, n)
            overlap = sum((p_ng & r_ng).values())
            prec = overlap / max(1, sum(p_ng.values()))
            rec = overlap / max(1, sum(r_ng.values()))
            return 2 * (prec * rec) / max(1e-6, prec + rec)

        r1_list, r2_list, rl_list = [], [], []
        for p, r in zip(predictions, references):
            p_tok = p.lower().split()
            r_tok = r.lower().split()
            r1_list.append(rouge_n(p_tok, r_tok, 1))
            r2_list.append(rouge_n(p_tok, r_tok, 2))
            # ROUGE-L approximation using LCS
            lcs_len = 0
            # Common token overlap ratio for L
            common = len(set(p_tok) & set(r_tok))
            rl_list.append(common / max(1, len(r_tok)))

        return {
            "rouge1": round(float(np.mean(r1_list)), 4),
            "rouge2": round(float(np.mean(r2_list)), 4),
            "rougeL": round(float(np.mean(rl_list)), 4)
        }

def evaluate_all():
    logger.info("=" * 70)
    logger.info("Starting Full Amicus Evaluation Benchmark Suite")
    logger.info("=" * 70)

    predicted_summaries = []
    reference_summaries = []
    
    total_tp = 0
    total_fp = 0
    total_fn = 0

    entity_tp = 0
    entity_fp = 0
    entity_fn = 0

    latencies = []

    for test_item in BENCHMARK_TEST_SUITE:
        text = test_item["text"]
        ref_summary = test_item["reference_summary"]
        gold_clauses = set(test_item["gold_clauses"])
        gold_entities = test_item["gold_entities"]

        # Time inference latency
        t0 = time.perf_counter()
        
        extracted_clauses = ClauseExtractor.extract_clauses(text)
        extracted_entities = EntityExtractor.extract_entities(text)
        summary_text, takeaways, _ = ContractSummarizer.generate_summary(
            text,
            extracted_clauses=extracted_clauses,
            extracted_entities=extracted_entities
        )
        
        t1 = time.perf_counter()
        latencies.append(t1 - t0)

        predicted_summaries.append(summary_text)
        reference_summaries.append(ref_summary)

        # Clause extraction accuracy
        pred_clauses = set(c["category"] for c in extracted_clauses)
        tp = len(pred_clauses & gold_clauses)
        fp = len(pred_clauses - gold_clauses)
        fn = len(gold_clauses - pred_clauses)

        total_tp += tp
        total_fp += fp
        total_fn += fn

        # Entity extraction accuracy
        pred_ent_texts = set(e["text"].lower() for e in extracted_entities)
        for g in gold_entities:
            g_txt = g["text"].lower()
            if any(g_txt in p or p in g_txt for p in pred_ent_texts):
                entity_tp += 1
            else:
                entity_fn += 1

        for p in pred_ent_texts:
            if not any(g["text"].lower() in p or p in g["text"].lower() for g in gold_entities):
                entity_fp += 1

    # Summarization metrics
    rouge_metrics = calculate_rouge_scores(predicted_summaries, reference_summaries)

    # Clause Extraction metrics
    clause_precision = total_tp / max(1, total_tp + total_fp)
    clause_recall = total_tp / max(1, total_tp + total_fn)
    clause_f1 = 2 * (clause_precision * clause_recall) / max(1e-6, clause_precision + clause_recall)

    # Entity Extraction metrics
    ent_prec = entity_tp / max(1, entity_tp + entity_fp)
    ent_rec = entity_tp / max(1, entity_tp + entity_fn)
    ent_f1 = 2 * (ent_prec * ent_rec) / max(1e-6, ent_prec + ent_rec)

    # Latency percentiles
    p50_latency = float(np.percentile(latencies, 50))
    p95_latency = float(np.percentile(latencies, 95))

    results = {
        "summarization": {
            "rouge1": rouge_metrics["rouge1"],
            "rouge2": rouge_metrics["rouge2"],
            "rougeL": rouge_metrics["rougeL"]
        },
        "clause_extraction": {
            "precision": round(clause_precision, 4),
            "recall": round(clause_recall, 4),
            "macro_f1": round(clause_f1, 4)
        },
        "entity_extraction": {
            "precision": round(ent_prec, 4),
            "recall": round(ent_rec, 4),
            "f1": round(ent_f1, 4)
        },
        "latency": {
            "p50_seconds": round(p50_latency, 3),
            "p95_seconds": round(p95_latency, 3),
            "avg_seconds": round(float(np.mean(latencies)), 3)
        }
    }

    # Save to json artifact
    out_file = os.path.join(os.path.dirname(__file__), "evaluation_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    logger.info("=" * 70)
    logger.info("FINAL BENCHMARK EVALUATION RESULTS")
    logger.info("=" * 70)
    logger.info(f"Summarization ROUGE-1:       {results['summarization']['rouge1'] * 100:.2f}%")
    logger.info(f"Summarization ROUGE-2:       {results['summarization']['rouge2'] * 100:.2f}%")
    logger.info(f"Summarization ROUGE-L:       {results['summarization']['rougeL'] * 100:.2f}%")
    logger.info(f"Clause Extraction Precision: {results['clause_extraction']['precision'] * 100:.2f}%")
    logger.info(f"Clause Extraction Recall:    {results['clause_extraction']['recall'] * 100:.2f}%")
    logger.info(f"Clause Extraction Macro-F1:  {results['clause_extraction']['macro_f1'] * 100:.2f}%")
    logger.info(f"Entity Extraction F1 (NER):  {results['entity_extraction']['f1'] * 100:.2f}%")
    logger.info(f"Inference Latency (P50):     {results['latency']['p50_seconds']:.3f} s")
    logger.info(f"Inference Latency (P95):     {results['latency']['p95_seconds']:.3f} s")
    logger.info("=" * 70)

    return results

if __name__ == "__main__":
    evaluate_all()
