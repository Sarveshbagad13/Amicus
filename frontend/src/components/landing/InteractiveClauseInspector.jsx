import React, { useState } from 'react';
import { 
  FileSearch, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles, 
  Scale, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  GitPullRequest
} from 'lucide-react';

export function InteractiveClauseInspector() {
  const [selectedDocId, setSelectedDocId] = useState('msa');
  const [copied, setCopied] = useState(false);

  const contractSamples = [
    {
      id: 'msa',
      name: 'SaaS Master Services Agreement (MSA)',
      type: 'Commercial Tech Contract',
      clauseSection: '§ 11.4 Uncapped Consequential Indemnity',
      riskLevel: 'severe',
      riskScore: '89 / 100 Risk Rating',
      riskSummary: 'High Exposure: Vendor requires Customer to indemnify against all indirect and consequential damages with zero aggregate liability cap.',
      originalText: `The Customer shall defend, indemnify, and hold harmless Vendor, its affiliates, officers, and employees from and against any and all claims, losses, damages, liabilities, and expenses (including reasonable attorneys' fees and unlimited consequential or lost profit damages) arising out of or related to Customer's use of the Platform or breach of any provision herein, without financial limitation.`,
      plainEnglish: 'This clause forces your company to pay for all possible lost profits and indirect claims the vendor might ever suffer if you breach any term, with zero financial ceiling.',
      proposedRedline: `Each party shall defend, indemnify, and hold harmless the other party from third-party claims arising solely from gross negligence or willful misconduct. Neither party shall be liable for indirect, punitive, or consequential damages. Total liability under this indemnity shall not exceed 2× the total fees paid in the twelve (12) months preceding the claim.`,
      recommendation: 'Reject uncapped liability immediately. Insert standard mutual gross-negligence standard and 2× trailing 12-month fee cap.'
    },
    {
      id: 'nda',
      name: 'Mutual Non-Disclosure Agreement (NDA)',
      type: 'Confidentiality & IP',
      clauseSection: '§ 4.1 Perpetual Confidentiality & Residuals',
      riskLevel: 'caution',
      riskScore: '64 / 100 Risk Rating',
      riskSummary: 'Ambiguous Scope: 10-year term on general business information and broad "residuals clause" allowing memory-based usage of trade secrets.',
      originalText: `The obligations of confidentiality shall survive for ten (10) years following termination. Either party may freely use any generalized ideas, concepts, know-how, or techniques retained in the unaided memories of personnel who had access to Confidential Information ("Residuals").`,
      plainEnglish: 'A 10-year confidentiality period is abnormally long for commercial data, and the residuals clause creates a loophole permitting employees to use confidential concepts if retained in memory.',
      proposedRedline: `The obligations of confidentiality shall survive for three (3) years following termination (except Trade Secrets, which shall survive for so long as permitted by applicable law). The Residuals clause is hereby deleted in its entirety.`,
      recommendation: 'Cap standard confidentiality at 3 years while carving out bona fide trade secrets. Strike the broad residuals clause.'
    },
    {
      id: 'lease',
      name: 'Commercial Real Estate Master Lease',
      type: 'Real Estate & Facilities',
      clauseSection: '§ 22.3 Unconditional Operating Expense Pass-Through',
      riskLevel: 'caution',
      riskScore: '58 / 100 Risk Rating',
      riskSummary: 'Financial Risk: Uncapped annual CAM (Common Area Maintenance) increase without structural capital expenditure exclusions.',
      originalText: `Tenant shall pay as Additional Rent its Proportionate Share of Operating Expenses, including all capital improvements, roof replacements, and management fees, without limitation or annual cap on escalation.`,
      plainEnglish: 'The landlord can pass through 100% of major building renovations (like roof replacements) directly to you as monthly operating costs without any annual percentage cap.',
      proposedRedline: `Tenant's Proportionate Share of Controllable Operating Expenses shall not increase by more than five percent (5%) per annum on a cumulative, compounded basis. Capital improvements and structural replacements shall be expressly excluded from Operating Expenses.`,
      recommendation: 'Insert 5% annual cumulative cap on controllable operating expenses and exclude capital replacements amortized under GAAP.'
    },
    {
      id: 'employment',
      name: 'Executive IP Assignment & Restrictive Covenant',
      type: 'Employment & Labor',
      clauseSection: '§ 9.1 Worldwide 2-Year Non-Compete',
      riskLevel: 'severe',
      riskScore: '92 / 100 Risk Rating',
      riskSummary: 'Statutory Violation: Worldwide non-compete for 24 months violates current state and federal labor standards.',
      originalText: `Executive agrees that during employment and for twenty-four (24) months post-termination, Executive shall not directly or indirectly engage in, advise, or invest in any business competing with the Company globally.`,
      plainEnglish: 'Prevents the executive from working for any competitor worldwide for 2 full years, which is largely unenforceable under modern labor laws and creates litigation exposure.',
      proposedRedline: `During employment, Executive shall devote full business time to the Company. Post-termination restrictive covenants shall be limited to a twelve (12) month non-solicitation of current clients and key employees, strictly governed by local jurisdictional law.`,
      recommendation: 'Sever the worldwide non-compete clause to prevent litigation risk; replace with focused 12-month client and employee non-solicit.'
    }
  ];

  const currentDoc = contractSamples.find(d => d.id === selectedDocId) || contractSamples[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDoc.proposedRedline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="clause-inspector" className="py-24 bg-canvas relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent-border text-accent text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading tracking-tight mb-4">
            Experience the analysis engine{' '}
            <span className="editorial-italic font-normal">in real-time.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Select a commercial contract type below to inspect how Amicus classifies toxic liabilities, translates legalese, and prepares verified redlines.
          </p>
        </div>

        {/* Contract Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {contractSamples.map((doc) => {
            const isSelected = doc.id === selectedDocId;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-accent text-accent-fg border-accent shadow-card'
                    : 'bg-surface text-body hover:text-heading hover:bg-subtle border-border'
                }`}
              >
                <span>{doc.name}</span>
                <span 
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                    isSelected 
                      ? 'bg-accent-hover text-accent-fg' 
                      : 'bg-subtle text-muted'
                  }`}
                >
                  {doc.type.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Inspector Two-Column Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Original Clause & Risk Summary */}
          <div className="lg:col-span-6 bg-surface rounded-xl border border-border p-6 sm:p-8 shadow-card flex flex-col justify-between">
            <div>
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-border">
                <div>
                  <span className="text-xs font-mono font-bold text-muted block">
                    {currentDoc.clauseSection}
                  </span>
                  <h3 className="text-base font-bold text-heading">
                    Original Contract Draft
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span 
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
                      currentDoc.riskLevel === 'severe'
                        ? 'bg-risk-severe-soft text-risk-severe border-risk-severe-border'
                        : 'bg-risk-caution-soft text-risk-caution border-risk-caution-border'
                    }`}
                  >
                    {currentDoc.riskScore}
                  </span>
                </div>
              </div>

              {/* Original Raw Text */}
              <div className="mb-6">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2 font-mono">
                  As Written in Agreement:
                </span>
                <div className="p-4 rounded-lg bg-subtle border border-border text-xs sm:text-sm font-mono leading-relaxed text-body">
                  {currentDoc.originalText}
                </div>
              </div>

              {/* Plain-English Translation */}
              <div className="p-4 rounded-lg bg-canvas border border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-heading uppercase tracking-wider mb-1.5">
                  <Scale className="w-3.5 h-3.5 text-accent" />
                  <span>Plain-English Legal Translation</span>
                </div>
                <p className="text-xs sm:text-sm text-body leading-relaxed">
                  {currentDoc.plainEnglish}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>Risk Classification: Deterministic Grounding</span>
              <span className="font-semibold text-heading">Audit Status: Flagged</span>
            </div>
          </div>

          {/* Right Column: Amicus Redline & Playbook Recommendation */}
          <div className="lg:col-span-6 bg-surface rounded-xl border border-accent-border p-6 sm:p-8 shadow-card ring-1 ring-accent/20">
            
            {/* Header Info */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-accent-soft text-accent flex items-center justify-center font-bold">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-heading">
                    Amicus Verified Redline
                  </h3>
                  <span className="text-xs text-muted">
                    Automated Firm Playbook Adjustment
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded bg-subtle hover:bg-border text-xs font-semibold text-heading border border-border flex items-center gap-1.5 transition-all"
                title="Copy recommended redline"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                    <span className="text-accent">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted" />
                    <span>Copy Redline</span>
                  </>
                )}
              </button>
            </div>

            {/* Proposed Redline Content */}
            <div className="mb-6">
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider block mb-2 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Market-Standard Recommended Language:</span>
              </span>
              <div className="p-4 rounded-lg bg-accent-soft/50 border border-accent-border text-xs sm:text-sm font-sans leading-relaxed text-heading">
                {currentDoc.proposedRedline}
              </div>
            </div>

            {/* Counsel Strategy Note */}
            <div className="p-4 rounded-lg bg-subtle border border-border mb-6">
              <span className="text-[11px] font-bold text-heading uppercase tracking-wider block mb-1">
                Negotiation Strategy Note:
              </span>
              <p className="text-xs sm:text-sm text-body leading-relaxed">
                {currentDoc.recommendation}
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted font-mono">
                Word Track Changes: Compatible
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                <ShieldCheck className="w-4 h-4" />
                <span>Fiduciary Compliant</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
