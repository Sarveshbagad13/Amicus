import React from 'react';
import { 
  Cpu, 
  Database, 
  FileCheck2, 
  Layers, 
  Workflow, 
  FileText,
  ShieldCheck,
  Binary
} from 'lucide-react';

export function TrustMetricsBar() {
  const metrics = [
    {
      value: 'CUAD & BillSum',
      label: 'Specialized Legal Datasets',
      description: 'Fine-tuned on the Contract Understanding Atticus Dataset and US Congressional legislative corpus.'
    },
    {
      value: '< 3.5s',
      label: 'End-to-End Pipeline Latency',
      description: 'Rapid document parsing, clause classification, entity extraction, and executive summarization.'
    },
    {
      value: '100% Isolated',
      label: 'User-Scoped Security',
      description: 'Strict per-user authorization with MongoDB cascading deletion ensuring complete data ownership.'
    }
  ];

  const techStack = [
    { name: 'RoBERTa & Transformers', tag: 'Clause Detection' },
    { name: 'BART Summarizer', tag: 'Executive Briefs' },
    { name: 'spaCy NER', tag: 'Entity Extraction' },
    { name: 'PyMuPDF & python-docx', tag: 'Text Engine' },
    { name: 'FastAPI Backend', tag: 'Async API' },
    { name: 'PDF Report Generator', tag: 'Export Engine' },
  ];

  return (
    <section className="py-14 bg-surface border-y border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 3 Core Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {metrics.map((metric, index) => (
            <div 
              key={index}
              className="flex flex-col p-6 rounded-lg bg-canvas border border-border hover:border-border-hover transition-all duration-200 shadow-subtle group"
            >
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-heading group-hover:text-accent transition-colors">
                  {metric.value}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              </div>
              <h3 className="text-base font-bold text-heading mb-1.5">
                {metric.label}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {metric.description}
              </p>
            </div>
          ))}
        </div>

        {/* Tech Stack Row */}
        <div className="pt-8 border-t border-border flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted shrink-0">
            <Cpu className="w-4 h-4 text-accent" />
            <span>Built on Battle-Tested AI & Data Stack:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 sm:gap-4">
            {techStack.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-subtle border border-border text-xs font-medium text-body hover:border-accent-border hover:bg-accent-soft/40 transition-all duration-150"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent/70" />
                <span className="font-semibold text-heading">{item.name}</span>
                <span className="text-[10px] text-muted font-mono bg-canvas px-1.5 py-0.5 rounded border border-border">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

