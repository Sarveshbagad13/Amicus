import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const LegalDisclaimerBanner = () => {
  return (
    <aside aria-label="Legal Disclaimer" className="bg-canvas border-b border-border px-4 py-2 text-xs text-body">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-risk-caution shrink-0" />
          <span>
            <strong className="font-bold text-heading uppercase tracking-wide mr-1">Not Legal Advice:</strong>
            Amicus is an AI-powered document analysis engine for informational purposes. It does not provide formal legal advice or create an attorney-client relationship.
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-accent-soft text-accent border border-accent-border shrink-0">
          Deterministic Guardrail
        </span>
      </div>
    </aside>
  );
};
