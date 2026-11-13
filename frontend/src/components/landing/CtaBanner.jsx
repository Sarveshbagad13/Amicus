import React from 'react';
import { ArrowRight, Sparkles, Scale, ShieldCheck, Check, PlayCircle } from 'lucide-react';

export function CtaBanner({ onStartTrial, onExploreSandbox }) {
  return (
    <section className="py-20 bg-canvas relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="relative rounded-2xl bg-accent text-accent-fg p-10 sm:p-14 lg:p-16 overflow-hidden shadow-elevated border border-accent-hover">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-grid-parchment opacity-10 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-soft/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-3xl">
            
            {/* Header Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-hover text-accent-fg text-xs font-bold uppercase tracking-wider mb-6 border border-accent-border/30">
              <Scale className="w-3.5 h-3.5" />
              <span>Transform Your Legal Workflow</span>
            </div>

            {/* Editorial Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
              Review contracts in seconds,{' '}
              <span className="editorial-italic font-normal opacity-95">
                not sleepless weekends.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-accent-fg/85 leading-relaxed mb-8 max-w-2xl">
              Accelerate your contract review workflow. Catch high-risk liabilities, inspect extracted clauses with exact character spans, and generate turnkey PDF reports in seconds with Amicus.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
              <button
                onClick={onStartTrial}
                className="px-7 py-3.5 rounded bg-surface text-heading hover:bg-subtle font-bold text-sm transition-all duration-150 shadow-card flex items-center justify-center gap-2 group"
              >
                <span>Launch Contract Analyzer</span>
                <ArrowRight className="w-4 h-4 text-accent transition-transform group-hover:translate-x-1" />
              </button>

              {onExploreSandbox && (
                <button
                  onClick={onExploreSandbox}
                  className="px-6 py-3.5 rounded bg-accent-hover hover:bg-accent-active border border-accent-border/40 text-accent-fg font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4 text-accent-fg" />
                  <span>Explore Live Sandbox ▸</span>
                </button>
              )}
            </div>

            {/* Micro Guarantees */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-accent-fg/80 pt-4 border-t border-accent-border/20">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Isolated Per-User Data & Deletion</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>CUAD & BillSum Benchmark Fine-Tuned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Deterministic Span & Entity Offsets</span>
              </div>
            </div>


          </div>

        </div>

      </div>
    </section>
  );
}
