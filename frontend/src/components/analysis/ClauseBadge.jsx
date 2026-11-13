import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  Scale, 
  DollarSign, 
  Lock,
  ChevronRight
} from 'lucide-react';

/**
 * RATIONALE:
 * Uses a restrained legal token system where high-risk items are distinctly flagged
 * in terracotta, caution items in sienna, and safe/standard clauses in institutional spruce.
 */
const CATEGORY_META = {
  'Indemnity': {
    severity: 'severe',
    icon: AlertOctagon,
    label: 'Indemnity & Liability Risk'
  },
  'Limitation of Liability': {
    severity: 'severe',
    icon: AlertOctagon,
    label: 'Damage Caps & Carveouts'
  },
  'Auto-Renewal': {
    severity: 'caution',
    icon: Clock,
    label: 'Renewal Notice Period'
  },
  'Termination': {
    severity: 'safe',
    icon: AlertTriangle,
    label: 'Termination for Convenience'
  },
  'Confidentiality': {
    severity: 'safe',
    icon: Lock,
    label: 'Proprietary Protection'
  },
  'Governing Law': {
    severity: 'safe',
    icon: Scale,
    label: 'Choice of Forum & Jurisdiction'
  },
  'Payment Terms': {
    severity: 'safe',
    icon: DollarSign,
    label: 'Invoicing & Retainers'
  },
  'Non-Compete / Restrictive Covenants': {
    severity: 'severe',
    icon: AlertOctagon,
    label: 'Restrictive Covenant'
  },
};

export const ClauseBadge = ({ category, isSelected, onClick, pageNumber, riskLevel }) => {
  const meta = CATEGORY_META[category] || {
    severity: riskLevel || 'safe',
    icon: FileCheck,
    label: category
  };

  const severity = riskLevel || meta.severity || 'safe';
  const IconComponent = meta.icon;

  // Strict token-based styling
  const severityClasses = {
    severe: {
      card: isSelected ? 'bg-risk-severe-soft border-risk-severe ring-1 ring-risk-severe' : 'bg-surface border-risk-severe-border hover:border-risk-severe',
      badge: 'bg-risk-severe-soft text-risk-severe border-risk-severe-border',
      text: 'text-risk-severe',
      label: 'Severe Risk'
    },
    caution: {
      card: isSelected ? 'bg-risk-caution-soft border-risk-caution ring-1 ring-risk-caution' : 'bg-surface border-risk-caution-border hover:border-risk-caution',
      badge: 'bg-risk-caution-soft text-risk-caution border-risk-caution-border',
      text: 'text-risk-caution',
      label: 'Caution'
    },
    safe: {
      card: isSelected ? 'bg-accent-soft border-accent ring-1 ring-accent' : 'bg-surface border-border hover:border-border-hover',
      badge: 'bg-accent-soft text-accent border-accent-border',
      text: 'text-accent',
      label: 'Standard'
    }
  }[severity] || {
    card: 'bg-surface border-border',
    badge: 'bg-subtle text-body border-border',
    text: 'text-body',
    label: 'Audited'
  };

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-subtle ${severityClasses.card}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${severityClasses.badge}`}>
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-heading truncate">
            {category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {pageNumber && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-subtle text-muted border border-border">
              p. {pageNumber}
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${severityClasses.badge}`}>
            {severityClasses.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted pt-1">
        <span>Deterministic CUAD Match</span>
        <span className="font-mono font-medium text-body">Verified Span</span>
      </div>
    </div>
  );
};
