import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Printer, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Type,
  Layers,
  Sparkles,
  Tag,
  BookOpen,
  Download,
  Share2,
  Loader2
} from 'lucide-react';
import { EntitySidebar } from './EntitySidebar';
import { DocumentViewer } from './DocumentViewer';
import { SummaryDrawer } from './SummaryDrawer';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * =========================================================================
 * AMICUS CONTRACT INTELLIGENCE WORKSPACE
 * =========================================================================
 * RATIONALE: Restructures the results layout away from cramped 3-column panels
 * into an authoritative source document reading canvas with an expandable,
 * tabbed AI analysis command center. Grouped top toolbar unifies search,
 * zoom, export, and view modes.
 * =========================================================================
 */
export const DocumentWorkspace = ({ data, onBack, onDeleteSuccess }) => {
  const [selectedClause, setSelectedClause] = useState(null);
  const [selectedEntityText, setSelectedEntityText] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  
  // Workspace Layout & Tooling State
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('summary'); // 'summary' | 'entities' | 'clauses'
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(15); // px
  const [fontFamily, setFontFamily] = useState('serif'); // 'serif' | 'sans'

  const { token } = useAuth();

  // Robust unpacking of document payload across all possible backend / cached data shapes
  const document = data?.document || data || {};
  const summary = data?.summary || {};
  const clauses = data?.clauses || [];
  const entities = data?.entities || [];

  const isDemoDoc = Boolean(data?.isDemo || document?.isDemo || (document.filename && document.filename.includes('Master_Services_Agreement_Sample')));
  const extractionMode = data?.entity_extraction_mode || document?.entity_extraction_mode || 'full';

  // Reconstruct full text deterministically from all potential sources
  const resolvedFullText = useMemo(() => {
    // 1. Direct full_text on root payload
    if (typeof data?.full_text === 'string' && data.full_text.trim()) {
      return data.full_text.trim();
    }
    // 2. full_text or raw_text on document object
    if (typeof document?.full_text === 'string' && document.full_text.trim()) {
      return document.full_text.trim();
    }
    if (typeof document?.raw_text === 'string' && document.raw_text.trim()) {
      return document.raw_text.trim();
    }
    // 3. Synthesize from extracted clauses array
    if (Array.isArray(clauses) && clauses.length > 0) {
      const clauseTexts = clauses
        .map((c) => (typeof c === 'string' ? c : c?.clause_text || ''))
        .filter((t) => t && t.trim().length > 0);
      if (clauseTexts.length > 0) {
        return clauseTexts.join('\n\n');
      }
    }
    // 4. Synthesize from summary text if available
    if (summary?.summary_text && typeof summary.summary_text === 'string') {
      return `MASTER CONTRACT SYNTHESIS\n\n${summary.summary_text}`;
    }
    return '';
  }, [data, document, clauses, summary]);

  const handleDelete = async () => {
    if (!document._id && !document.id) return;
    setIsDeleting(true);
    try {
      const docId = document._id || document.id;
      await api.documents.delete(docId, token);
      onDeleteSuccess(docId);
    } catch (err) {
      alert(`Deletion error: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleExport = async () => {
    const docId = document._id || document.id;
    if (token && docId && !isDemoDoc) {
      try {
        setIsExporting(true);
        const blob = await api.documents.exportPdf(docId, token);
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${(document.filename || 'Contract_Report').replace(/\.[^/.]+$/, '')}_Amicus_Report.pdf`;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } catch (err) {
        console.warn('PDF export failed, falling back to print dialog:', err);
        window.print();
      } finally {
        setIsExporting(false);
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-canvas overflow-hidden">
      
      {/* Grouped Unified Workspace Header & Command Bar */}
      <header className="h-16 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-subtle z-30">
        
        {/* Left: Navigation & Document Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-muted hover:text-heading hover:bg-subtle border border-border transition-colors shrink-0"
            title="Return to documents list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-border flex items-center justify-center text-accent shrink-0">
              <FileText className="w-4 h-4 stroke-[2]" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-heading truncate max-w-xs sm:max-w-md">
                  {document.filename || 'Contract_Analysis_Report.pdf'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent-border">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Analysis</span>
                </span>
              </div>
              <p className="text-[11px] text-muted -mt-0.5 truncate hidden sm:block">
                {document.page_count || 1} {document.page_count === 1 ? 'page' : 'pages'} · 100% Deterministic Extraction
              </p>
            </div>
          </div>
        </div>

        {/* Center: In-Document Keyword Search */}
        <div className="hidden md:flex items-center max-w-xs w-full mx-4">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in contract text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-canvas border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-heading placeholder:text-muted focus:outline-none focus:border-accent transition-all"
            />
          </div>
        </div>

        {/* Right: View Controls, Export & Panel Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Font Controls */}
          <div className="hidden lg:flex items-center gap-1 bg-subtle p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              className="p-1 rounded text-muted hover:text-heading hover:bg-canvas"
              title="Decrease text size"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-muted px-1 min-w-[28px] text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              className="p-1 rounded text-muted hover:text-heading hover:bg-canvas"
              title="Increase text size"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-3 w-px bg-border mx-1" />
            <button
              onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
              className="px-1.5 py-0.5 rounded text-[11px] font-bold text-muted hover:text-heading hover:bg-canvas"
              title="Toggle font typography"
            >
              {fontFamily === 'serif' ? 'Serif' : 'Sans'}
            </button>
          </div>

          {/* Toggle Fullscreen Document / Split Mode */}
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isPanelCollapsed
                ? 'bg-accent-soft text-accent border-accent-border'
                : 'bg-surface text-muted hover:text-heading border-border hover:bg-subtle'
            }`}
            title={isPanelCollapsed ? 'Show AI Analysis Panel' : 'Expand Document to Full Width'}
          >
            {isPanelCollapsed ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isPanelCollapsed ? 'Show Analysis' : 'Focus Mode'}</span>
          </button>

          {/* Export Action */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface text-heading hover:bg-subtle border border-border transition-colors shadow-subtle disabled:opacity-50"
            title="Download PDF Report"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" /> : <Download className="w-3.5 h-3.5 text-muted" />}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          {/* Delete Action */}
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="p-2 rounded-lg text-muted hover:text-risk-severe hover:bg-risk-severe-soft border border-transparent hover:border-risk-severe-border transition-colors"
            title="Permanently hard-delete contract"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
      </header>

      {/* Persistent Dismissible Demo Mode Banner */}
      {isDemoDoc && !demoBannerDismissed && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Demo Mode:</strong> You are reviewing a simulated Master Services Agreement. Upload your own contracts with an account to run the full neural pipeline.
            </span>
          </div>
          <button
            onClick={() => setDemoBannerDismissed(true)}
            className="text-amber-800 hover:text-amber-950 font-bold px-2 py-0.5 rounded text-[11px] hover:bg-amber-500/20 transition-colors"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Reduced Extraction Mode Notice */}
      {extractionMode === 'reduced' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-800 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Reduced Extraction Mode:</strong> Neural linguistic model (spaCy) unavailable. Entities were extracted using deterministic fallback patterns.
            </span>
          </div>
        </div>
      )}

      {/* Main Workspace Body (Document Left, Analysis Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left / Center Area: Primary Source Document */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border">
          <DocumentViewer
            fullText={resolvedFullText}
            selectedClause={selectedClause}
            selectedEntityText={selectedEntityText}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            fontSize={fontSize}
            fontFamily={fontFamily}
          />
        </div>

        {/* Right Area: AI Analysis Command Drawer */}
        {!isPanelCollapsed && (
          <aside className="w-full lg:w-[440px] bg-surface flex flex-col h-full overflow-hidden shrink-0 border-t lg:border-t-0 border-border animate-fadeIn">
            
            {/* Header: AI-Derived Analysis Identifier & Segment Switch */}
            <div className="p-3.5 border-b border-border bg-canvas flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-heading font-mono">
                  AI-Derived Intelligence
                </h3>
              </div>

              {/* Segmented View Switcher */}
              <div className="inline-flex rounded-lg bg-subtle p-0.5 border border-border text-xs">
                <button
                  onClick={() => setActiveAnalysisTab('summary')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                    activeAnalysisTab === 'summary'
                      ? 'bg-surface text-heading shadow-subtle'
                      : 'text-muted hover:text-heading'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveAnalysisTab('entities')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 ${
                    activeAnalysisTab === 'entities'
                      ? 'bg-surface text-heading shadow-subtle'
                      : 'text-muted hover:text-heading'
                  }`}
                >
                  <span>Entities</span>
                  <span className="text-[10px] font-mono text-accent font-semibold">({entities.length})</span>
                </button>
                <button
                  onClick={() => setActiveAnalysisTab('clauses')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 ${
                    activeAnalysisTab === 'clauses'
                      ? 'bg-surface text-heading shadow-subtle'
                      : 'text-muted hover:text-heading'
                  }`}
                >
                  <span>Clauses</span>
                  <span className="text-[10px] font-mono text-accent font-semibold">({clauses.length})</span>
                </button>
              </div>
            </div>

            {/* Active Analysis Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeAnalysisTab === 'summary' && (
                <SummaryDrawer
                  summary={summary}
                  clauses={clauses}
                  onSelectClause={(clause) => {
                    setSelectedClause(clause);
                    setSelectedEntityText(null);
                  }}
                  selectedClauseId={selectedClause?._id}
                />
              )}

              {activeAnalysisTab === 'entities' && (
                <EntitySidebar
                  entities={entities}
                  onSelectEntity={(text) => {
                    setSelectedEntityText(text);
                    setSelectedClause(null);
                  }}
                  selectedEntityText={selectedEntityText}
                />
              )}

              {activeAnalysisTab === 'clauses' && (
                <SummaryDrawer
                  summary={summary}
                  clauses={clauses}
                  onSelectClause={(clause) => {
                    setSelectedClause(clause);
                    setSelectedEntityText(null);
                  }}
                  selectedClauseId={selectedClause?._id}
                />
              )}
            </div>

          </aside>
        )}

      </div>

      {/* Hard Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-elevated space-y-4">
            <div className="flex items-center gap-3 text-risk-severe">
              <div className="w-10 h-10 rounded-xl bg-risk-severe-soft border border-risk-severe-border flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-heading">Permanently Delete Contract?</h3>
                <p className="text-xs text-muted">Cryptographic purge from ephemeral storage</p>
              </div>
            </div>

            <p className="text-xs text-body leading-relaxed bg-canvas p-3.5 rounded-xl border border-border">
              In accordance with Amicus Zero Data Retention policy, this will permanently delete the agreement, extracted entities, and plain summary. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-muted hover:text-heading hover:bg-subtle transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-risk-severe hover:opacity-90 text-white transition-all shadow-subtle"
              >
                {isDeleting ? 'Purging...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
