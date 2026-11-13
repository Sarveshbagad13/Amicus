import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Scale,
  Sparkles,
  Search,
  Check,
  Layers,
  GitPullRequest,
  Lock,
  Cpu
} from 'lucide-react';

export function HeroSection({ onStartTrial, onExploreSandbox }) {
  const [activeClauseIndex, setActiveClauseIndex] = useState(0);

  const sampleClauses = [
    {
      id: 'clause-1',
      section: '§ 12.3 Limitation of Liability',
      status: 'severe',
      badgeText: 'Severe Risk Flag',
      originalText: 'Neither party shall be liable for indirect damages, EXCEPT Customer shall indemnify Vendor without limitation for all consequential, punitive, and lost revenue damages.',
      redlineText: 'Neither party shall be liable for indirect, punitive, or consequential damages. Total aggregate liability for either party shall be capped at 2× the fees paid in preceding 12 months.',
      firmRule: 'Detected Category: Indemnity · High Exposure Liability Span',
      benefit: 'Flags unilateral uncapped exposure and highlights exact character boundaries.'
    },
    {
      id: 'clause-2',
      section: '§ 8.2 Non-Solicitation & IP Carveout',
      status: 'caution',
      badgeText: 'Ambiguity Detected',
      originalText: 'Receiving Party agrees not to engage or hire any employee or contractor of Disclosing Party worldwide for a period of five (5) consecutive years from execution date.',
      redlineText: 'Receiving Party shall not directly solicit key technical personnel for twelve (12) months; general public job postings and non-targeted recruiting expressly permitted.',
      firmRule: 'Detected Category: Restrictive Covenants',
      benefit: 'Surfaces broad temporal and geographic restrictions for counsel review.'
    },
    {
      id: 'clause-3',
      section: '§ 19.4 Governing Law & Dispute Resolution',
      status: 'safe',
      badgeText: 'Standard Clause',
      originalText: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of laws principles. Exclusive venue in Chancery Court.',
      redlineText: 'Verified Standard Clause — Matches Delaware Chancery benchmark.',
      firmRule: 'Detected Category: Governing Law',
      benefit: 'Entity extraction accurately tags Delaware Chancery Court jurisdiction.'
    }
  ];

  // Auto-cycle clauses every 6 seconds if user hasn't manually clicked
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveClauseIndex((prev) => (prev + 1) % sampleClauses.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [sampleClauses.length]);

  const currentClause = sampleClauses[activeClauseIndex];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-canvas">

      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 bg-grid-parchment pointer-events-none opacity-60" />

      {/* Subtle Radial Glow from Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">

            {/* Small Pill / Badge Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-soft border border-accent-border text-accent mb-6 shadow-subtle animate-fadeIn">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              <span className="text-[12px] font-bold tracking-wide uppercase">
                Contract Intelligence Platform
              </span>
            </div>

            {/* Large 2-Line Editorial Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-heading tracking-tight leading-[1.12] mb-6">
              Precision legal review.{' '}
              <br className="hidden sm:inline" />
              <span className="editorial-italic font-normal text-heading">
                Zero wasted billable hours.
              </span>
            </h1>

            {/* 2-3 Line Supporting Paragraph */}
            <p className="text-lg sm:text-xl text-muted font-normal leading-relaxed max-w-2xl mb-8">
              Amicus parses commercial agreements and legislative bills, flags high-risk clauses against CUAD benchmarks, extracts key entities, and generates executive summaries with downloadable PDF reports.
            </p>


            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-8">
              <button
                onClick={onStartTrial}
                className="px-7 py-3.5 rounded bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active font-semibold text-[15px] shadow-card hover:shadow-elevated transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>Launch Contract Analyzer</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={onExploreSandbox}
                className="px-6 py-3.5 rounded bg-surface hover:bg-subtle border border-border hover:border-border-hover text-heading font-semibold text-[15px] transition-all duration-200 flex items-center justify-center gap-2 shadow-subtle group"
              >
                <PlayCircle className="w-4 h-4 text-accent transition-transform duration-200 group-hover:scale-110" />
                <span>Explore Live Sandbox</span>
                <span className="text-accent text-xs font-mono font-bold">▸</span>
              </button>
            </div>

            {/* Trust Micro-Badges */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[12px] text-muted font-medium pt-2 border-t border-border/80">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>Zero data retention guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>SOC 2 Type II & HIPAA compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>No credit card required</span>
              </div>
            </div>

          </div>

          {/* Right Column: Metaphorical / Abstract Legal Intelligence Visual */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative mx-auto max-w-lg lg:max-w-none">

              {/* Decorative Document Layer Shadows */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-border/50 to-accent-soft/40 rounded-xl blur-md -rotate-1 pointer-events-none" />
              <div className="absolute inset-0 bg-surface/50 rounded-xl rotate-1 border border-border pointer-events-none" />

              {/* Main Document Workspace Card */}
              <div className="relative bg-surface rounded-xl border border-border shadow-elevated overflow-hidden">

                {/* Simulated Document Top Bar */}
                <div className="bg-subtle px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong/60" />
                    <span className="text-xs font-mono font-medium text-muted ml-2 truncate max-w-[200px]">
                      Master_Services_Agreement_v4.2.docx
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent-soft text-accent text-[11px] font-semibold border border-accent-border">
                    <Cpu className="w-3 h-3" />
                    <span>Neural OCR Active</span>
                  </div>
                </div>

                {/* Simulated Laser Scanner Line */}
                <div className="relative h-1 w-full bg-transparent overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-accent to-transparent opacity-75 animate-scan-line" />
                </div>

                {/* Clause Tabs Selector */}
                <div className="p-3 bg-canvas/60 border-b border-border flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">
                    Clauses:
                  </span>
                  {sampleClauses.map((clause, idx) => {
                    const isActive = idx === activeClauseIndex;
                    return (
                      <button
                        key={clause.id}
                        onClick={() => setActiveClauseIndex(idx)}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${isActive
                          ? 'bg-surface text-heading font-semibold shadow-subtle border border-border'
                          : 'text-muted hover:text-heading hover:bg-surface/60'
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${clause.status === 'severe'
                            ? 'bg-risk-severe'
                            : clause.status === 'caution'
                              ? 'bg-risk-caution'
                              : 'bg-risk-safe'
                            }`}
                        />
                        <span>{clause.section.split(' ')[0]} {clause.section.split(' ')[1]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Clause Inspection Card */}
                <div className="p-5 space-y-4">

                  {/* Clause Header & Risk Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-semibold text-muted block mb-0.5">
                        {currentClause.section}
                      </span>
                      <h4 className="text-sm font-bold text-heading">
                        {currentClause.id === 'clause-1' && 'Consequential Damages & Indemnity'}
                        {currentClause.id === 'clause-2' && 'Restrictive Non-Solicitation Covenant'}
                        {currentClause.id === 'clause-3' && 'Delaware Chancery Jurisdiction'}
                      </h4>
                    </div>

                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border shrink-0 ${currentClause.status === 'severe'
                        ? 'bg-risk-severe-soft text-risk-severe border-risk-severe-border'
                        : currentClause.status === 'caution'
                          ? 'bg-risk-caution-soft text-risk-caution border-risk-caution-border'
                          : 'bg-risk-safe-soft text-risk-safe border-risk-safe-border'
                        }`}
                    >
                      {currentClause.badgeText}
                    </span>
                  </div>

                  {/* Original Clause (As Drafted) */}
                  <div className="p-3 rounded bg-subtle/70 border border-border text-xs leading-relaxed text-body font-mono">
                    <span className="text-[10px] font-bold text-muted uppercase block font-sans mb-1">
                      Original Drafting:
                    </span>
                    {currentClause.originalText}
                  </div>

                  {/* Metaphorical Transformation: Proposed Redline & Checkmark */}
                  <div className="p-3.5 rounded bg-accent-soft/70 border border-accent-border text-xs leading-relaxed text-heading relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                        <GitPullRequest className="w-3 h-3" />
                        <span>Amicus Automated Redline</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready to Apply</span>
                      </span>
                    </div>
                    <p className="font-sans text-body">
                      {currentClause.redlineText}
                    </p>
                  </div>

                  {/* Playbook Analysis & Risk Mitigation */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted truncate max-w-[280px]">
                      <Scale className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{currentClause.firmRule}</span>
                    </div>
                    <span className="font-semibold text-accent shrink-0">
                      Audit Trail ✓
                    </span>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
