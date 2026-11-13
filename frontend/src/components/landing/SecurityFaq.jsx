import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Lock, FileText, CheckCircle2 } from 'lucide-react';

export function SecurityFaq({ onLaunchApp }) {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How is user data stored and kept private?",
      answer: "All uploaded contracts, extracted clauses, and generated summaries are tied strictly to authenticated user accounts via JWT tokens. Each database query in our FastAPI backend isolates queries by user ID so users can only ever access their own document history."
    },
    {
      question: "Can I permanently delete my documents and analysis records?",
      answer: "Yes. Amicus features atomic cascading hard deletion. When you delete a document from your dashboard, the system permanently purges the document record, raw text, executive summaries, extracted clauses, and entity tags across all database collections."
    },
    {
      question: "Does Amicus provide formal legal advice?",
      answer: "No. Amicus is an AI-assisted analysis tool engineered for informational and workflow assistance. It does not constitute legal advice, provide legal representation, or establish an attorney-client relationship. All insights should be verified by a licensed legal professional."
    },
    {
      question: "What document formats and file sizes are supported?",
      answer: "Amicus supports digital PDF (.pdf) and Microsoft Word (.docx) files up to 20 MB. The ingestion engine parses selectable digital text and preserves page boundaries. Scanned image files without selectable text layers are automatically flagged to ensure high analytical fidelity."
    },
    {
      question: "What AI models power clause detection and summarization?",
      answer: "Amicus utilizes RoBERTa transformer models fine-tuned on the Contract Understanding Atticus Dataset (CUAD) for clause extraction, BART models for abstractive and extractive summarization, and customized spaCy pipelines for legal Named Entity Recognition."
    }
  ];


  return (
    <section id="security" className="py-24 bg-surface border-y border-border relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent-border text-accent text-xs font-bold uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Compliance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading tracking-tight mb-4">
            Architected for attorney-client{' '}
            <span className="editorial-italic font-normal">privilege.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Essential questions answered regarding data isolation, fiduciary obligations, and compliance standards.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-canvas border-accent/60 shadow-subtle'
                    : 'bg-canvas/50 border-border hover:border-border-hover'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-base sm:text-lg font-bold text-heading">
                    {faq.question}
                  </span>
                  <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-sm text-body leading-relaxed border-t border-border/60 animate-fadeIn">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Security Seals Box */}
        <div className="mt-12 p-6 rounded-xl bg-canvas border border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-accent" />
            <div>
              <h4 className="text-sm font-bold text-heading">
                Ready to review our Security Whitepaper?
              </h4>
              <p className="text-xs text-muted">
                Detailed SOC 2 Type II controls, cryptographic keys, and ephemeral memory proofs.
              </p>
            </div>
          </div>
          <button
            onClick={onLaunchApp}
            className="px-4 py-2 rounded bg-surface hover:bg-subtle text-xs font-bold text-heading border border-border shadow-subtle transition-all"
          >
            Explore Security Controls
          </button>
        </div>

      </div>
    </section>
  );
}
