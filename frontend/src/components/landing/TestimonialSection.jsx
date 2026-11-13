import React from 'react';
import { Database, Binary, Scale, ShieldCheck, CheckCircle2, Cpu, Sparkles } from 'lucide-react';

export function TestimonialSection() {
  const benchmarks = [
    {
      title: "CUAD Commercial Benchmark",
      dataset: "Contract Understanding Atticus Dataset",
      description: "Fine-tuned on 500+ commercial contracts curated by legal scholars at The Atticus Project and Stanford Law. Specializes in detecting high-risk indemnification, liability caps, and termination rights.",
      metrics: [
        "RoBERTa transformer clause extractor",
        "Exact character span boundaries & offsets",
        "IoU overlap threshold deduplication"
      ],
      badge: "Commercial Contracts"
    },
    {
      title: "BillSum Legislative Corpus",
      dataset: "US Congressional Legislation",
      description: "Trained on thousands of US Congressional legislative bills to detect statutory preambles, appropriations, and enacted clauses with domain-specific legislative routing.",
      metrics: [
        "Automatic contract vs bill document routing",
        "BART-based abstractive bill summarization",
        "Direct extraction of grant and budget amounts"
      ],
      badge: "Legislative Acts"
    },
    {
      title: "Customized Legal NER Pipeline",
      dataset: "Linguistic & Financial Entities",
      description: "Custom spaCy Named Entity Recognition pipeline structured for legal agreements. Accurately pulls parties, currencies, effective dates, and governing law jurisdictions.",
      metrics: [
        "PARTY, MONEY, DATE, and GOVERNING_LAW entities",
        "Extracted context snippets for fast verification",
        "Direct contextual span mapping"
      ],
      badge: "Entity Intelligence"
    }
  ];

  const datasetStats = [
    { label: "Contract Understanding Benchmark", value: "CUAD v1.0" },
    { label: "Legislative Summarization Corpus", value: "BillSum" },
    { label: "Entity Extraction Framework", value: "spaCy Core" },
    { label: "Transformer Architectures", value: "RoBERTa + BART" }
  ];

  return (
    <section className="py-24 bg-surface border-y border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent-border text-accent text-xs font-bold uppercase tracking-wider mb-4">
            <Binary className="w-3.5 h-3.5" />
            <span>Empirical Legal AI Foundations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading tracking-tight mb-4">
            Trained on verified legal corpora and{' '}
            <span className="editorial-italic font-normal">academic benchmarks.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Amicus uses specialized models fine-tuned on recognized legal datasets rather than generic consumer prompts.
          </p>
        </div>

        {/* Benchmarks 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {benchmarks.map((b, idx) => (
            <div
              key={idx}
              className="p-8 rounded-xl bg-canvas border border-border hover:border-border-hover transition-all duration-200 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent-border">
                    {b.badge}
                  </span>
                  <Database className="w-4 h-4 text-muted" />
                </div>
                <h3 className="text-lg font-bold text-heading mb-1">
                  {b.title}
                </h3>
                <span className="text-xs font-mono text-muted block mb-3">
                  {b.dataset}
                </span>
                <p className="text-xs text-body leading-relaxed mb-6">
                  {b.description}
                </p>
              </div>

              <div className="pt-5 border-t border-border">
                <ul className="space-y-2">
                  {b.metrics.map((m, mIdx) => (
                    <li key={mIdx} className="flex items-start gap-2 text-xs text-muted">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <span className="text-body font-medium">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>

        {/* Dataset Reference Row */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Cpu className="w-4 h-4 text-accent" />
            <span>Zero Third-Party Model Callouts · In-House Pipeline Inference</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-muted">
            {datasetStats.map((item, i) => (
              <span key={i} className="px-2.5 py-1 rounded bg-subtle border border-border">
                <strong>{item.label}:</strong> {item.value}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

