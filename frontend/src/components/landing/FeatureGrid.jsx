import React, { useState } from 'react';
import { 
  ShieldAlert, 
  FileText, 
  Tag, 
  LockKeyhole, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertOctagon, 
  FileSearch,
  Scale,
  Cpu,
  Sparkles,
  Download
} from 'lucide-react';

export function FeatureGrid() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 'cuad-clause-extraction',
      icon: ShieldAlert,
      tag: 'CUAD Clause Engine',
      title: 'Automated High-Risk Clause Extraction',
      summary: 'Automatically detects and categorizes critical contract provisions—including Indemnity, Limitation of Liability, Termination, Auto-Renewal, and Governing Law.',
      highlights: [
        'Fine-tuned RoBERTa transformer pipeline trained on the CUAD benchmark',
        'Exact character span offsets, page mapping, and risk classification',
        'IoU overlap threshold deduplication to eliminate duplicate text spans'
      ],
      mockup: {
        title: 'Extracted Clause Span',
        clause: '§ 14.2 Contractor shall defend, indemnify, and hold harmless Client against all third-party claims...',
        flag: 'Category: Indemnity · High Risk Span',
        fix: 'Character Spans [100 - 250] · Page 2'
      }
    },
    {
      id: 'neural-summarization',
      icon: Sparkles,
      tag: 'BART Summarizer',
      title: 'Executive Summaries & Commercial Takeaways',
      summary: 'Generates concise, plain-English executive summaries and bulleted key takeaways using BART abstractive and extractive summarization models.',
      highlights: [
        'Tailored summarization models for both commercial contracts and legislative bills (BillSum)',
        'Key commercial takeaways synthesized from extracted clause metadata',
        'Model guardrail sanitization preventing legal advice claims or hallucinations'
      ],
      mockup: {
        title: 'Executive Brief Generated',
        clause: 'Document synthesized into 3 core commercial takeaways.',
        flag: 'Doc Type: Commercial Contract · Token Count: 240',
        fix: 'Key Points: Net-30 payment terms, mutual termination for convenience.'
      }
    },
    {
      id: 'entity-extraction',
      icon: Tag,
      tag: 'spaCy NER Pipeline',
      title: 'Legal Entity & Financial Term Extraction',
      summary: 'Extracts contracting parties, currency amounts, effective dates, and governing jurisdictions directly from raw document text using customized spaCy NER.',
      highlights: [
        'Categorizes PARTY, MONEY, DATE, and GOVERNING_LAW entities',
        'Extracts context snippets around each extracted entity for fast verification',
        'Context-aware boundary detection derived from linguistic and entity signals'
      ],
      mockup: {
        title: 'Entities Identified',
        clause: 'Global Tech Solutions Inc. · $12,500 USD / month · Delaware Chancery Court',
        flag: '4 Entity Types Discovered',
        fix: 'Full context snippet mapped to document viewer.'
      }
    },
    {
      id: 'export-and-privacy',
      icon: LockKeyhole,
      tag: 'PDF Export & Privacy',
      title: 'Turnkey PDF Reports & User Data Isolation',
      summary: 'Download complete, branded PDF analysis reports or manage your archived reviews with strict per-user authorization and cascading deletion in MongoDB.',
      highlights: [
        'One-click PDF analysis report export with summary, clauses, and entities',
        'Strict JWT authentication ensuring users only access their own documents',
        'Permanent cascading deletion across all collections (documents, summaries, clauses)'
      ],
      mockup: {
        title: 'PDF Report Ready',
        clause: 'Report generated with executive summary, risk table, and disclaimer.',
        flag: 'Hard Deletion Available · 100% User Scoped',
        fix: 'Download via GET /api/documents/:id/export'
      }
    }
  ];


  return (
    <section id="features" className="py-24 bg-canvas relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent-border text-accent text-xs font-bold uppercase tracking-wider mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading tracking-tight leading-tight mb-4">
            Engineered for forensic rigor.{' '}
            <span className="editorial-italic font-normal block sm:inline">
              Built for legal discretion.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Every feature in Amicus is purpose-built to accelerate legal workflow without compromising fiduciary standards or client privilege.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-surface rounded-xl border border-border hover:border-border-hover p-8 transition-all duration-200 shadow-subtle hover:shadow-card flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Card Header: Icon & Category Tag */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-lg bg-accent-soft text-accent flex items-center justify-center border border-accent-border group-hover:scale-105 transition-transform duration-200">
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="text-[11px] font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-subtle text-muted border border-border">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-heading mb-3 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-body leading-relaxed mb-6">
                    {item.summary}
                  </p>

                  {/* Feature Highlights Checklist */}
                  <ul className="space-y-2.5 mb-8">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-muted">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span className="text-body font-medium">{h}</span>
                      </li>
                    ))}
                  </ul>

                </div>

                {/* Micro-Mockup Box */}
                <div className="pt-4 border-t border-border bg-canvas/70 -mx-8 -mb-8 p-6 rounded-b-xl">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                    <span className="font-mono text-heading">{item.mockup.title}</span>
                    <span className="text-accent">Live Analysis</span>
                  </div>
                  <div className="bg-surface p-3 rounded border border-border text-xs space-y-2">
                    <div className="font-mono text-[11px] text-body bg-subtle p-2 rounded truncate">
                      {item.mockup.clause}
                    </div>
                    <div className="text-[11px] font-semibold text-risk-severe flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.mockup.flag}</span>
                    </div>
                    <div className="text-[11px] text-accent flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.mockup.fix}</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
