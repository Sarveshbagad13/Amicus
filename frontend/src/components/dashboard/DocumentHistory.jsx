import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Search, Trash2, ArrowRight, Loader2, Clock, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const DocumentHistory = ({ onSelectDocument, onNewUpload, onRequireAuth }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingDocId, setOpeningDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const { token, isAuthenticated, user } = useAuth();

  useEffect(() => {
    async function fetchDocs() {
      if (!isAuthenticated || !token) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let docs = [];

        // 1. Fetch from server for the authenticated user
        try {
          const res = await api.documents.list(token, { page, limit });
          docs = res.data?.documents || res.data || [];
          if (res.data?.meta) {
            setTotalPages(res.data.meta.total_pages || 1);
            setTotalCount(res.data.meta.total || docs.length);
          }
        } catch (apiErr) {
          console.warn('Backend documents list unavailable, checking user cache:', apiErr);
        }

        // 2. Merge local cache documents scoped strictly to this user
        if (user?.id) {
          try {
            const userCacheKey = `amicus_saved_docs_${user.id}`;
            const savedDocs = JSON.parse(localStorage.getItem(userCacheKey) || '{}');
            const localList = Object.values(savedDocs).map((item) => {
              const doc = item.document || {};
              const docId = doc._id || doc.id || `doc-cached-${Date.now()}`;
              return {
                _id: docId,
                id: docId,
                filename: doc.filename || 'Contract_Analysis.pdf',
                page_count: doc.page_count || 1,
                created_at: doc.created_at || new Date().toISOString(),
                summary_snippet: item.summary?.summary_text?.slice(0, 200) || '',
                key_takeaways_count: item.summary?.key_takeaways?.length || 0,
                full_text: item.full_text || doc.full_text
              };
            });

            // Merge without duplicates
            const existingIds = new Set(docs.map((d) => String(d._id || d.id)));
            for (const localDoc of localList) {
              if (localDoc.id && !existingIds.has(String(localDoc.id))) {
                docs.push(localDoc);
                existingIds.add(String(localDoc.id));
              }
            }
          } catch (storageErr) {
            console.warn('Error reading user local cache:', storageErr);
          }
        }

        setDocuments(docs);
      } catch (err) {
        setError(err.message || 'Failed to load document history.');
      } finally {
        setLoading(false);
      }
    }

    fetchDocs();
  }, [token, isAuthenticated, user?.id, page]);

  const handleOpenDoc = async (docId) => {
    try {
      setOpeningDocId(docId);
      let payload = null;

      // 1. Fetch full document details from backend API
      if (token) {
        try {
          const res = await api.documents.getById(docId, token);
          payload = res?.data?.data || res?.data || res;
        } catch (apiErr) {
          console.warn('API getById failed, checking user cache fallback:', apiErr);
        }
      }

      // 2. Check local storage cache for complete data or full_text scoped to this user
      if (user?.id) {
        try {
          const userCacheKey = `amicus_saved_docs_${user.id}`;
          const savedDocs = JSON.parse(localStorage.getItem(userCacheKey) || '{}');
          const cachedItem = savedDocs[docId];
          if (cachedItem) {
            payload = {
              ...cachedItem,
              ...(payload || {}),
              document: {
                ...(cachedItem.document || {}),
                ...(payload?.document || {})
              },
              full_text: cachedItem.full_text || payload?.full_text || payload?.document?.full_text,
              clauses: (payload?.clauses && payload.clauses.length > 0) ? payload.clauses : cachedItem.clauses,
              entities: (payload?.entities && payload.entities.length > 0) ? payload.entities : cachedItem.entities,
              summary: payload?.summary || cachedItem.summary
            };
          }
        } catch (e) {
          console.warn('Cache lookup failed:', e);
        }
      }

      // 3. Fallback: if full_text is still missing, synthesize it from clauses or summary
      if (payload) {
        const docObj = payload.document || payload;
        const clausesList = payload.clauses || [];

        let resolvedText = payload.full_text || docObj.full_text || docObj.raw_text || '';
        
        if (!resolvedText && Array.isArray(clausesList) && clausesList.length > 0) {
          resolvedText = clausesList
            .map((c) => (typeof c === 'string' ? c : c.clause_text || ''))
            .filter((t) => t && t.trim())
            .join('\n\n');
        }

        if (!resolvedText && payload.summary?.summary_text) {
          resolvedText = `MASTER CONTRACT SYNTHESIS\n\n${payload.summary.summary_text}`;
        }

        const normalizedPayload = {
          document: docObj,
          summary: payload.summary || {},
          clauses: clausesList,
          entities: payload.entities || [],
          full_text: resolvedText
        };

        onSelectDocument(normalizedPayload);
      } else {
        throw new Error('Document content could not be found.');
      }
    } catch (err) {
      alert(`Unable to load document: ${err.message}`);
    } finally {
      setOpeningDocId(null);
    }
  };

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Permanently delete this contract and all extracted records?')) return;

    try {
      if (token) {
        try {
          await api.documents.delete(docId, token);
        } catch (apiErr) {
          console.warn('API delete error:', apiErr);
        }
      }
      
      // Remove from user-specific cache
      if (user?.id) {
        try {
          const userCacheKey = `amicus_saved_docs_${user.id}`;
          const savedDocs = JSON.parse(localStorage.getItem(userCacheKey) || '{}');
          delete savedDocs[docId];
          localStorage.setItem(userCacheKey, JSON.stringify(savedDocs));
        } catch (e) {}
      }

      setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== docId));
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  // Auth Guard: If not signed in, show informative sign-in card
  if (!isAuthenticated || !token) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 sm:px-6 animate-fadeIn">
        <div className="bg-surface border border-border rounded-2xl p-8 sm:p-10 text-center shadow-card space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent-border flex items-center justify-center text-accent mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-heading">Sign In to View Your History</h3>
            <p className="text-xs text-muted mt-2 max-w-md mx-auto leading-relaxed">
              Your analyzed contracts, clause extractions, and summaries are securely stored and tied to your account. Please sign in or register to access your past analysis records.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onRequireAuth}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-xs font-bold transition-all shadow-subtle flex items-center justify-center gap-2"
            >
              <span>Sign In / Register</span>
            </button>
            <button
              onClick={onNewUpload}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-subtle hover:bg-border text-heading text-xs font-semibold border border-border transition-colors"
            >
              Upload New Contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredDocs = documents.filter((d) =>
    (d.filename || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.summary_snippet || '').toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-heading tracking-tight">
            Contract Analysis History
          </h2>
          <p className="text-xs text-muted mt-1">
            Access past reviews, obligations, and clause extractions instantly without re-processing.
          </p>
        </div>

        <button
          onClick={onNewUpload}
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-bold text-xs transition-colors shrink-0 shadow-subtle flex items-center gap-1.5"
        >
          <span>+ Analyze New Contract</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter analyzed contracts by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-heading placeholder:text-muted focus:outline-none focus:border-accent"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <span className="text-xs text-muted">Loading contract archives...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-risk-severe-soft border border-risk-severe-border text-xs text-risk-severe text-center">
          {error}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3 shadow-subtle">
          <FileText className="w-10 h-10 text-muted mx-auto" />
          <h4 className="text-sm font-bold text-heading">No Contract Records Found</h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchQuery
              ? `No contracts match "${searchQuery}".`
              : 'You have not uploaded any contracts yet. Upload your first document to see extracted clauses and summaries here.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onNewUpload}
              className="mt-2 inline-flex px-4 py-2 rounded-lg bg-subtle hover:bg-border text-heading text-xs font-bold border border-border"
            >
              Upload a Contract
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDocs.map((doc) => {
            const docId = doc._id || doc.id;
            const isOpening = openingDocId === docId;
            const dateStr = doc.created_at
              ? new Date(doc.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recently';

            return (
              <div
                key={docId}
                onClick={() => !isOpening && handleOpenDoc(docId)}
                className={`bg-surface border border-border hover:border-accent-border rounded-xl p-5 cursor-pointer transition-all hover:shadow-card group relative ${
                  isOpening ? 'ring-2 ring-accent opacity-80' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent-border flex items-center justify-center text-accent shrink-0 mt-0.5">
                      {isOpening ? (
                        <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-heading truncate group-hover:text-accent transition-colors">
                          {doc.filename}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle text-muted border border-border">
                          {doc.page_count || 1} {doc.page_count === 1 ? 'page' : 'pages'}
                        </span>
                        {isOpening && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-accent-fg animate-pulse">
                            Loading Full Text...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-muted mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted" />
                          {dateStr}
                        </span>
                        {doc.key_takeaways_count > 0 && (
                          <span className="text-accent font-semibold">
                            {doc.key_takeaways_count} Commercial Takeaways
                          </span>
                        )}
                      </div>

                      {doc.summary_snippet && (
                        <p className="text-xs text-body mt-2.5 line-clamp-2 leading-relaxed font-serif">
                          "{doc.summary_snippet}..."
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, docId)}
                      className="p-2 text-muted hover:text-risk-severe hover:bg-risk-severe-soft rounded-lg transition-colors"
                      title="Permanently Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-7 h-7 rounded-lg bg-subtle flex items-center justify-center text-muted group-hover:bg-accent group-hover:text-accent-fg transition-all">
                      {isOpening ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 px-2 mt-4 text-xs gap-3">
          <span className="text-muted">
            Showing Page <strong className="text-heading font-semibold">{page}</strong> of <strong className="text-heading font-semibold">{totalPages}</strong> ({totalCount} total contracts)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-subtle text-heading disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-subtle text-heading disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
