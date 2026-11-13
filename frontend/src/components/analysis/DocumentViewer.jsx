import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Type,
  Maximize2,
  Copy
} from 'lucide-react';

/**
 * =========================================================================
 * AMICUS SOURCE DOCUMENT VIEWER
 * =========================================================================
 * RATIONALE: Renders original legal agreements in an authentic archival bond
 * paper format. Generous line height and high-contrast typography eliminate
 * fatigue during multi-hour review sessions.
 * =========================================================================
 */
export const DocumentViewer = ({ 
  fullText = '', 
  selectedClause, 
  selectedEntityText,
  searchTerm = '',
  onSearchChange,
  fontSize = 15,
  fontFamily = 'serif'
}) => {
  const viewerRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Smooth scroll to selected clause or entity
  useEffect(() => {
    if (selectedClause?.clause_text && viewerRef.current) {
      const activeEl = viewerRef.current.querySelector('.clause-active-target');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (selectedEntityText && viewerRef.current) {
      const activeEl = viewerRef.current.querySelector('.entity-active-target');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedClause, selectedEntityText]);

  // Smooth scroll to first matching search span whenever searchTerm changes
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0 && viewerRef.current) {
      const matchEl = viewerRef.current.querySelector('.search-match-span');
      if (matchEl) {
        matchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchTerm]);

  const renderHighlightedContent = (text, query) => {
    const trimmed = (query || '').trim();
    if (!trimmed) return text;

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-match-span bg-amber-200 text-amber-950 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const paragraphs = fullText.split('\n\n').filter((p) => p.trim());

  const handleCopyFullText = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden relative">
      
      {/* Source Document Identifier Banner */}
      <div className="h-10 border-b border-border bg-subtle/70 px-4 sm:px-6 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-accent" />
          <span className="font-bold text-heading">
            Source Agreement
          </span>
          <span className="text-muted text-[11px] hidden sm:inline">
            — Read-Only Quoted Text
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-muted">
            {paragraphs.length} Sections
          </span>
          <button
            onClick={handleCopyFullText}
            className="text-[11px] font-semibold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
            title="Copy full text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-accent stroke-[2.5]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-muted" />
                <span>Copy Draft</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Document Reading Canvas */}
      <div
        ref={viewerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10"
      >
        {/* Archival Bond Paper Container */}
        <div 
          className="max-w-3xl mx-auto bg-surface rounded-xl border border-border shadow-card p-8 sm:p-14 space-y-6 text-body leading-relaxed transition-all"
          style={{ 
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily === 'serif' ? '"Newsreader", "Merriweather", Georgia, serif' : '"Plus Jakarta Sans", Inter, sans-serif'
          }}
        >
          
          {/* Simulated Document Header */}
          <div className="border-b border-border pb-4 mb-6 text-center font-sans">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted block mb-1">
              Executed Counterpart Agreement
            </span>
            <div className="h-0.5 w-12 bg-accent mx-auto mt-2" />
          </div>

          {paragraphs.map((para, idx) => {
            const isClauseMatch = selectedClause?.clause_text && (
              para.includes(selectedClause.clause_text) ||
              selectedClause.clause_text.includes(para.slice(0, 40))
            );

            const isEntityMatch = selectedEntityText && para.toLowerCase().includes(selectedEntityText.toLowerCase());

            const isSearchMatch = searchTerm && searchTerm.length > 1 && para.toLowerCase().includes(searchTerm.toLowerCase());

            return (
              <div
                key={idx}
                className={`relative pl-8 sm:pl-10 pr-4 py-3 rounded-lg transition-all duration-200 ${
                  isClauseMatch
                    ? 'clause-active-target bg-accent-soft border-l-4 border-accent shadow-subtle'
                    : isEntityMatch
                    ? 'entity-active-target bg-subtle border-l-4 border-heading shadow-subtle'
                    : isSearchMatch
                    ? 'bg-amber-100/60 border-l-4 border-amber-500'
                    : 'hover:bg-canvas/80'
                }`}
              >
                {/* Paragraph Section Index */}
                <span className="absolute left-2 top-3 text-[11px] font-mono font-bold text-muted select-none">
                  §{idx + 1}
                </span>

                {/* Paragraph Content */}
                <p className="whitespace-pre-wrap leading-relaxed">
                  {renderHighlightedContent(para, searchTerm)}
                </p>
              </div>
            );
          })}

          {/* Simulated Document Footer */}
          <div className="pt-8 mt-10 border-t border-border flex items-center justify-between text-xs text-muted font-sans">
            <div className="flex items-center gap-1.5 text-accent font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographically Grounded Text</span>
            </div>
            <span className="font-mono text-[11px]">
              End of Agreement
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
