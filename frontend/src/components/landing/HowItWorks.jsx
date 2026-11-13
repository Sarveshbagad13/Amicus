import React, { useState } from 'react';
import { 
  UploadCloud, 
  Binary, 
  FileOutput, 
  Check, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Sparkles,
  FileCheck
} from 'lucide-react';

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: '01',
      title: 'Ingest Legal PDF or Word Document',
      summary: 'Upload digital PDF or DOCX agreements up to 20 MB. Our ingestion engine parses selectable text, tracks exact page boundaries, and segments text using word-boundary chunking.',
      details: [
        'Page-by-page coordinate mapping via PyMuPDF and python-docx',
        'Automatic language validation & rejection of unscanned documents',
        'Preserves paragraph spans, character offsets, and numbering hierarchy'
      ],
      icon: UploadCloud,
      statusLabel: 'Ingestion & Validation Complete'
    },
    {
      number: '02',
      title: 'Neural Clause Extraction & Entity Tagging',
      summary: 'Amicus routes text through specialized RoBERTa models trained on CUAD to detect critical obligations, while spaCy NER surfaces parties, financial figures, and dates.',
      details: [
        'Classifies Indemnity, Liability, Termination, Governing Law, and Auto-Renewal',
        'Identifies contracting Parties, Dollar Amounts, Dates, and Jurisdictions',
        'Applies IoU deduplication to eliminate overlapping clause spans'
      ],
      icon: Binary,
      statusLabel: 'Clauses & Entities Classified'
    },
    {
      number: '03',
      title: 'Executive Summary & Turnkey PDF Export',
      summary: 'BART generates a plain-English executive summary with core commercial takeaways, presented in an interactive workspace and exportable as a turnkey PDF report.',
      details: [
        'Executive abstractive summary detailing primary obligations and terms',
        'Interactive split-screen viewer to inspect raw clause text alongside insights',
        'Downloadable branded PDF analysis report ready for client distribution'
      ],
      icon: FileOutput,
      statusLabel: 'Analysis Complete & PDF Ready'
    }
  ];


  return (
    <section id="how-it-works" className="py-24 bg-surface border-y border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent-border text-accent text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Workflow Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading tracking-tight mb-4">
            From raw draft to negotiated redline in{' '}
            <span className="editorial-italic font-normal">three steps.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Eliminate tedious manual first-pass contract reviews while elevating drafting rigor.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isSelected = activeStep === index;
            return (
              <div
                key={step.number}
                onClick={() => setActiveStep(index)}
                className={`relative p-8 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-canvas border-accent shadow-card ring-1 ring-accent/30'
                    : 'bg-canvas/50 border-border hover:border-border-hover hover:bg-canvas'
                }`}
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-extrabold font-serif text-accent">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-accent">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h3 className="text-lg font-bold text-heading mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-body leading-relaxed mb-6">
                    {step.summary}
                  </p>

                  {/* Details List */}
                  <ul className="space-y-2 mb-6">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-muted">
                        <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                        <span className="text-body font-medium">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Step Status Tag */}
                <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-muted">
                    {step.statusLabel}
                  </span>
                  <span className="font-semibold text-accent flex items-center gap-1">
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
