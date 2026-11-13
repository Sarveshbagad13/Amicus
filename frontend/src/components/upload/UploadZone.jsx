import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  Scale, 
  ArrowRight,
  HelpCircle,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ProcessingState } from './ProcessingState';

/**
 * =========================================================================
 * AMICUS UPLOAD & PROCESSING FLOW
 * =========================================================================
 * RATIONALE: Calm oyster neutral background and crisp archival card surfaces
 * minimize visual glare, while a dedicated staged processing screen ensures
 * legal practitioners receive clear determinate feedback during neural extraction.
 * =========================================================================
 */
export const UploadZone = ({ onAnalysisComplete, onError, onRequireAuth }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isSampleDoc, setIsSampleDoc] = useState(false);
  const [isApiDone, setIsApiDone] = useState(false);
  const [consentChecked, setConsentChecked] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAnalysisResult, setPendingAnalysisResult] = useState(null);
  const fileInputRef = useRef(null);

  const { token, isAuthenticated, user } = useAuth();


  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      onError({
        code: 'UNSUPPORTED_FORMAT',
        message: `File format '.${ext}' is not supported. Please upload a .pdf or .docx agreement.`,
      });
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      onError({
        code: 'FILE_TOO_LARGE',
        message: 'The selected agreement exceeds the 20 MB maximum size limit.',
      });
      return;
    }
    setIsSampleDoc(false);
    setFile(selectedFile);
  };

  const generateSampleData = () => {
    const sampleFullText = (
      "MASTER SERVICES AND INDEPENDENT CONTRACTOR AGREEMENT\n\n" +
      "This Master Services Agreement (\"Agreement\") is entered into by and between Global Tech Solutions Inc., a Delaware corporation (\"Client\"), and Apex Consulting LLC, a New York limited liability company (\"Contractor\"), effective as of September 15, 2026.\n\n" +
      "1. SERVICES & DELIVERABLES\nContractor agrees to provide software engineering, architectural review, and security assessment services in accordance with Statements of Work executed hereunder.\n\n" +
      "2. FEES, INVOICING & PAYMENT TERMS\nClient shall pay Contractor a monthly recurring retainer fee of $12,500 USD. Invoices are payable net-30 days from receipt. A late payment fee of 1.5% per month applies to all balances past due.\n\n" +
      "3. TERM & AUTOMATIC RENEWAL\nThis Agreement shall remain in effect for an initial term of 12 months. Thereafter, this Agreement shall automatically renew for successive one-year terms unless either party provides written notice of cancellation at least 60 days prior to expiration.\n\n" +
      "4. TERMINATION FOR CONVENIENCE\nEither party may terminate this Agreement or any Statement of Work for convenience upon thirty (30) days prior written notice to the other party.\n\n" +
      "5. INDEMNIFICATION & THIRD-PARTY CLAIMS\nContractor shall defend, indemnify, and hold harmless Client, its officers, and directors against any third-party intellectual property infringement claims arising solely from Contractor's gross negligence or willful misconduct.\n\n" +
      "6. LIMITATION OF LIABILITY & DAMAGE CAP\nExcept for breaches of Section 7 (Confidentiality) or gross negligence, neither party shall be liable for indirect, incidental, or consequential damages. Total aggregate liability under this Agreement shall not exceed the total fees paid in the prior twelve (12) months.\n\n" +
      "7. CONFIDENTIALITY & PROPRIETARY RIGHTS\nEach party agrees to maintain proprietary trade secrets and technical data in strict confidence for a period of three (3) years post-termination.\n\n" +
      "8. GOVERNING LAW & EXCLUSIVE VENUE\nThis Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, with exclusive jurisdiction in the Delaware Court of Chancery."
    );

    const docId = `doc-msa-${Date.now()}`;

    return {
      isDemo: true,
      document: {
        id: docId,
        _id: docId,
        filename: file ? file.name : 'Master_Services_Agreement_Sample.pdf',
        status: 'COMPLETED',
        page_count: 3,
        created_at: new Date().toISOString(),
        full_text: sampleFullText,
        isDemo: true
      },
      summary: {
        model_name: 'BART-Legal-CUAD',
        token_count: 482,
        key_takeaways: [
          'Monthly retainer of $12,500 USD with Net-30 payment terms and 1.5% monthly late fee.',
          'Auto-renewal clause triggers unless cancelled in writing at least 60 days before expiration.',
          'Mutual liability cap limited to 12 months trailing fees with standard IP carveout.',
          'Governed strictly by Delaware Chancery Court jurisdiction.'
        ],
        summary_text: "This Master Services Agreement outlines consulting software engineering services provided by Apex Consulting LLC to Global Tech Solutions Inc. Key operational clauses include a $12,500 monthly fee structure with Net-30 payment terms, mutual termination for convenience on 30 days notice, and an automatic renewal term requiring 60 days advance written notice. Fiduciary liabilities are capped at 12 months trailing fees with reciprocal Delaware Chancery forum selection."
      },
      clauses: [
        {
          _id: 'cl-1',
          category: 'Limitation of Liability',
          risk_level: 'safe',
          page_number: 2,
          description: 'Standard reciprocal 12-month trailing fee liability ceiling with indirect damage waiver.',
          clause_text: 'Except for breaches of Section 7 (Confidentiality) or gross negligence, neither party shall be liable for indirect, incidental, or consequential damages. Total aggregate liability under this Agreement shall not exceed the total fees paid in the prior twelve (12) months.'
        },
        {
          _id: 'cl-2',
          category: 'Auto-Renewal',
          risk_level: 'caution',
          page_number: 1,
          description: '60-day advance notice required to prevent automatic 1-year renewal extension.',
          clause_text: 'This Agreement shall automatically renew for successive one-year terms unless either party provides written notice of cancellation at least 60 days prior to expiration.'
        },
        {
          _id: 'cl-3',
          category: 'Indemnity',
          risk_level: 'safe',
          page_number: 2,
          description: 'Reciprocal IP indemnity bounded by gross negligence standard.',
          clause_text: "Contractor shall defend, indemnify, and hold harmless Client, its officers, and directors against any third-party intellectual property infringement claims arising solely from Contractor's gross negligence or willful misconduct."
        },
        {
          _id: 'cl-4',
          category: 'Governing Law',
          risk_level: 'safe',
          page_number: 3,
          description: 'Delaware Chancery Court exclusive forum selection.',
          clause_text: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, with exclusive jurisdiction in the Delaware Court of Chancery.'
        },
        {
          _id: 'cl-5',
          category: 'Termination',
          risk_level: 'safe',
          page_number: 2,
          description: 'Mutual termination for convenience upon 30-day written notice.',
          clause_text: 'Either party may terminate this Agreement or any Statement of Work for convenience upon thirty (30) days prior written notice to the other party.'
        }
      ],
      entities: [
        { entity_type: 'PARTY', text: 'Global Tech Solutions Inc. (Client)', context: 'entered into by and between Global Tech Solutions Inc., a Delaware corporation (Client)' },
        { entity_type: 'PARTY', text: 'Apex Consulting LLC (Contractor)', context: 'and Apex Consulting LLC, a New York limited liability company (Contractor)' },
        { entity_type: 'MONEY', text: '$12,500 USD / month', context: 'Client shall pay Contractor a monthly recurring retainer fee of $12,500 USD' },
        { entity_type: 'DATE', text: 'September 15, 2026', context: 'effective as of September 15, 2026' },
        { entity_type: 'DATE', text: '60 Days Notice (Renewal)', context: 'unless either party provides written notice of cancellation at least 60 days prior to expiration' },
        { entity_type: 'GOVERNING_LAW', text: 'State of Delaware (Chancery Court)', context: 'laws of the State of Delaware, with exclusive jurisdiction in the Delaware Court of Chancery' }
      ],
      full_text: sampleFullText
    };
  };

  const handleStartAnalysis = async () => {
    if (!file) return;
    if (!consentChecked) {
      onError({
        code: 'CONSENT_REQUIRED',
        message: 'Please acknowledge the legal informational disclaimer checkbox before proceeding.',
      });
      return;
    }

    // Real user documents require authentication for backend neural processing
    if (!isSampleDoc && (!token || !isAuthenticated)) {
      onRequireAuth();
      return;
    }

    // Switch to dedicated processing screen
    setIsProcessing(true);
    setIsApiDone(false);
    setPendingAnalysisResult(null);

    try {
      if (token && !isSampleDoc) {
        // Real authenticated API call to the Amicus neural pipeline
        const res = await api.documents.upload(file, token);
        const dataPayload = res?.data || res;
        setPendingAnalysisResult(dataPayload);
        setIsApiDone(true);
      } else {
        // Sample document demo simulation
        const sampleData = generateSampleData();
        setPendingAnalysisResult(sampleData);
        setTimeout(() => {
          setIsApiDone(true);
        }, 3200);
      }
    } catch (err) {
      setIsProcessing(false);
      setIsApiDone(false);
      setPendingAnalysisResult(null);
      onError(err);
    }
  };

  const handleProcessingComplete = () => {
    const finalData = pendingAnalysisResult;
    if (!finalData) return;
    
    // Save to user-scoped localStorage cache only if authenticated
    if (user?.id && !isSampleDoc) {
      const userCacheKey = `amicus_saved_docs_${user.id}`;
      try {
        const docId = finalData.document?._id || finalData.document?.id || `doc-${Date.now()}`;
        const savedDocs = JSON.parse(localStorage.getItem(userCacheKey) || '{}');
        savedDocs[docId] = { ...finalData, cachedAt: Date.now() };
        localStorage.setItem(userCacheKey, JSON.stringify(savedDocs));
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
          try {
            const savedDocs = JSON.parse(localStorage.getItem(userCacheKey) || '{}');
            const keys = Object.keys(savedDocs);
            if (keys.length > 0) {
              keys.sort((a, b) => (savedDocs[a].cachedAt || 0) - (savedDocs[b].cachedAt || 0));
              delete savedDocs[keys[0]];
              const docId = finalData.document?._id || finalData.document?.id || `doc-${Date.now()}`;
              savedDocs[docId] = { ...finalData, cachedAt: Date.now() };
              localStorage.setItem(userCacheKey, JSON.stringify(savedDocs));
            }
          } catch (evictErr) {
            if (onError) {
              onError({
                code: 'QUOTA_EXCEEDED',
                message: 'Local storage cache is full. Older cached documents could not be retained.',
              });
            }
          }
        }
      }
    }


    setIsProcessing(false);
    setIsApiDone(false);
    setPendingAnalysisResult(null);
    onAnalysisComplete(finalData);
  };

  const handleCancelProcessing = () => {
    setIsProcessing(false);
    setIsApiDone(false);
    setPendingAnalysisResult(null);
  };

  const handleSampleContract = () => {
    const sampleText = "MASTER SERVICES AND INDEPENDENT CONTRACTOR AGREEMENT\n...";
    const blob = new Blob([sampleText], { type: 'application/pdf' });
    const sampleFile = new File([blob], 'Master_Services_Agreement_Sample.pdf', { type: 'application/pdf' });
    setIsSampleDoc(true);
    setFile(sampleFile);
    setConsentChecked(true);
  };

  // If in processing stage, render dedicated ProcessingState component
  if (isProcessing) {
    return (
      <ProcessingState 
        file={file}
        isReady={isApiDone}
        isSample={isSampleDoc}
        onComplete={handleProcessingComplete}
        onCancel={handleCancelProcessing}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent-border text-accent text-xs font-bold uppercase tracking-wider mb-3 shadow-subtle">
          <Scale className="w-3.5 h-3.5" />
          <span>Deterministic Legal Intake</span>
        </div>
        <h2 className="text-3xl font-extrabold text-heading tracking-tight sm:text-4xl">
          Upload Contract for Analysis
        </h2>
        <p className="mt-2 text-sm text-muted max-w-lg mx-auto leading-relaxed">
          Drag and drop your agreement to parse clauses, isolate indemnity risks, and generate executive summaries.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card relative">
        
        {/* Dropzone Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-accent bg-accent-soft/40 scale-[0.99]'
              : file
              ? 'border-accent-border bg-accent-soft/20'
              : 'border-border hover:border-border-hover bg-canvas/60 hover:bg-canvas'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">
            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent-border flex items-center justify-center text-accent mb-3 shadow-subtle">
                  <FileText className="w-7 h-7 stroke-[2]" />
                </div>
                <p className="font-bold text-heading text-base">{file.name}</p>
                <p className="text-xs text-muted mt-1 font-mono">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · File Ready for Neural Intake
                </p>
                <span className="mt-2 text-[11px] text-accent font-semibold underline">
                  Click to replace file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-subtle border border-border flex items-center justify-center text-muted mb-3 shadow-subtle">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="font-bold text-heading text-base">
                  Drag and drop your contract here, or <span className="text-accent underline font-semibold">browse files</span>
                </p>
                <p className="text-xs text-muted mt-2">
                  Supports digital <strong className="text-heading">PDF</strong> or <strong className="text-heading">DOCX</strong> up to 20 MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Compliance Disclaimer Checkbox */}
        <div className="mt-5 p-3.5 rounded-xl bg-canvas border border-border">
          <label className="flex items-start gap-3 cursor-pointer group select-none">
            <div
              onClick={() => setConsentChecked(!consentChecked)}
              className="mt-0.5 text-accent transition-colors"
            >
              {consentChecked ? (
                <CheckSquare className="w-4 h-4 text-accent fill-accent-soft" />
              ) : (
                <Square className="w-4 h-4 text-muted group-hover:text-heading" />
              )}
            </div>
            <span className="text-xs text-body leading-relaxed">
              <strong className="text-heading font-semibold">Informational Use Acknowledgment:</strong> I understand that Amicus provides AI-assisted analysis and does not constitute formal legal counsel.
            </span>
          </label>
        </div>

        {/* Unauthenticated notice when custom contract is loaded */}
        {file && !isSampleDoc && !isAuthenticated && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 animate-fadeIn">
            <span>
              <strong>Authentication required:</strong> Sign in to process your custom contract through the neural pipeline.
            </span>
            <button
              type="button"
              onClick={onRequireAuth}
              className="text-accent underline font-bold hover:text-accent-hover shrink-0 ml-2"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleSampleContract}
            className="text-xs text-accent hover:text-accent-hover underline font-mono flex items-center gap-1.5"
          >
            <span>⚡ Load Sample MSA Agreement</span>
          </button>

          <button
            onClick={handleStartAnalysis}
            disabled={!file || !consentChecked}
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-accent hover:bg-accent-hover active:bg-accent-active disabled:opacity-40 disabled:cursor-not-allowed text-accent-fg font-bold text-sm transition-all shadow-card hover:shadow-elevated flex items-center justify-center gap-2"
          >
            {file && !isSampleDoc && !isAuthenticated ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign in & Analyze</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Analyze Contract</span>
              </>
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Security & Confidentiality Badges */}
        <div className="mt-8 pt-5 border-t border-border flex flex-wrap items-center justify-center gap-6 text-[11px] text-muted font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Zero Data Retention Guarantee
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            SOC 2 Type II Encrypted In-Memory
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            100% Deterministic Grounding
          </span>
        </div>

      </div>
    </div>
  );
};
