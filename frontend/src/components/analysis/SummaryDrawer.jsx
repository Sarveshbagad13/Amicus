import React, { useState } from 'react';
import { 
  BookOpen, 
  AlertOctagon, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  ExternalLink, 
  HelpCircle,
  Copy,
  Check,
  Scale
} from 'lucide-react';
import { ClauseBadge } from './ClauseBadge';

/**
 * =========================================================================
 * AMICUS AI ANALYSIS DRAWER
 * =========================================================================
 * RATIONALE: Houses AI-generated outputs (plain summaries and categorized
 * clauses) with clear visual demarcation from original document text.
 * =========================================================================
 */
export const SummaryDrawer = ({ 
  summary, 
  clauses = [], 
  onSelectClause, 
  selectedClauseId 
}) => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'clauses'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const categories = ['ALL', ...Array.from(new Set(clauses.map((c) => c.category)))];

  const filteredClauses = categoryFilter === 'ALL'
    ? clauses
    : clauses.filter((c) => c.category === categoryFilter);

  const handleCopySummary = () => {
    if (!summary?.summary_text) return;
    navigator.clipboard.writeText(summary.summary_text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      
      {/* Tab Switcher */}
      <div className="p-3 border-b border-border bg-subtle/50 flex gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'summary'
              ? 'bg-surface text-heading border border-border shadow-subtle'
              : 'text-muted hover:text-heading hover:bg-surface/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Executive Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('clauses')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'clauses'
              ? 'bg-surface text-heading border border-border shadow-subtle'
              : 'text-muted hover:text-heading hover:bg-surface/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-accent" />
          <span>CUAD Clauses ({clauses.length})</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        
        {activeTab === 'summary' ? (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header & Token Count */}
            <div className="flex items-center justify-between pb-3 border-b border-border text-xs text-muted font-mono">
              <span>
                Model: <strong className="text-heading font-sans">{summary?.model_name || 'BART-Legal-CUAD'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-subtle text-muted border border-border text-[10px]">
                {summary?.token_count || 480} tokens
              </span>
            </div>

            {/* Key Commercial Takeaways (Risk / Highlights) */}
            {summary?.key_takeaways && summary.key_takeaways.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5 font-mono">
                    <Scale className="w-3.5 h-3.5 text-accent" />
                    <span>Commercial Takeaways</span>
                  </h4>
                  <span className="text-[10px] font-bold text-accent font-mono uppercase bg-accent-soft px-1.5 py-0.5 rounded border border-accent-border">
                    {summary.key_takeaways.length} Key Points
                  </span>
                </div>

                <div className="space-y-2.5">
                  {summary.key_takeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-canvas border border-border flex items-start gap-2.5 text-xs text-body leading-relaxed shadow-subtle"
                    >
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5 stroke-[2.2]" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Plain-Language Narrative Summary */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-heading font-mono">
                  Plain-Language Synthesis
                </h4>
                <button
                  onClick={handleCopySummary}
                  className="text-[11px] font-semibold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3 h-3 text-accent stroke-[2.5]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-muted" />
                      <span>Copy Brief</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-canvas border border-border text-xs text-body leading-relaxed space-y-3">
                {summary?.summary_text ? (
                  summary.summary_text.split('\n\n').map((para, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="text-muted italic">No summary generated.</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Category Filter Pills */}
            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
                <Filter className="w-3 h-3 text-muted shrink-0" />
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap transition-colors font-semibold ${
                      categoryFilter === cat
                        ? 'bg-accent text-accent-fg shadow-subtle'
                        : 'bg-subtle text-muted hover:text-heading hover:bg-canvas'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Clauses List */}
            {clauses.length === 0 ? (
              <div className="p-6 rounded-xl bg-canvas border border-border text-center space-y-2">
                <HelpCircle className="w-6 h-6 text-muted mx-auto" />
                <h5 className="font-bold text-xs text-heading">No High-Risk Clauses Detected</h5>
                <p className="text-[11px] text-muted leading-relaxed">
                  All extracted terms fell within standard baseline thresholds. Review full document text.
                </p>
              </div>
            ) : filteredClauses.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">
                No clauses found for category "{categoryFilter}".
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredClauses.map((clause, idx) => {
                  const isSelected = selectedClauseId === (clause._id || clause.category + idx);
                  return (
                    <div
                      key={clause._id || idx}
                      className="space-y-2"
                    >
                      <ClauseBadge
                        category={clause.category}
                        pageNumber={clause.page_number}
                        riskLevel={clause.risk_level}
                        isSelected={isSelected}
                        onClick={() => onSelectClause(clause)}
                      />

                      {clause.description && (
                        <p className="text-[11px] text-muted px-1 leading-tight">
                          {clause.description}
                        </p>
                      )}

                      <div className="p-3 rounded-lg bg-canvas border border-border text-xs text-body font-mono leading-relaxed line-clamp-3">
                        "{clause.clause_text}"
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
