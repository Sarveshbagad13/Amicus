import React from 'react';
import { AlertTriangle, X, FileScan, Globe, FileWarning, ArrowRight } from 'lucide-react';

export const ErrorModal = ({ isOpen, onClose, errorData }) => {
  if (!isOpen || !errorData) return null;

  const isScanned = errorData.code === 'SCANNED_DOCUMENT_REJECTED';
  const isLanguage = errorData.code === 'UNSUPPORTED_LANGUAGE';
  const isCorrupted = errorData.code === 'CORRUPTED_FILE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-elevated relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-heading hover:bg-subtle rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-risk-severe-soft border border-risk-severe-border flex items-center justify-center shrink-0">
            {isScanned ? (
              <FileScan className="w-6 h-6 text-risk-severe" />
            ) : isLanguage ? (
              <Globe className="w-6 h-6 text-risk-caution" />
            ) : (
              <FileWarning className="w-6 h-6 text-risk-severe" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-heading">
              {isScanned
                ? 'Scanned Document Detected'
                : isLanguage
                ? 'Non-English Agreement Detected'
                : isCorrupted
                ? 'Corrupted or Password-Protected File'
                : 'Ingestion & Parsing Error'}
            </h3>
            <p className="text-xs text-muted mt-1 font-mono">
              Error Code: {errorData.code || 'PARSING_ERROR'}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-canvas border border-border text-sm text-body leading-relaxed">
          {errorData.message}
        </div>

        {/* Actionable Guidance */}
        <div className="mt-4 p-4 rounded-xl bg-subtle border border-border">
          <h4 className="text-xs font-bold text-heading uppercase tracking-wider mb-2 font-mono">
            Recommended Action:
          </h4>
          <ul className="text-xs text-body space-y-1.5 list-disc list-inside">
            {isScanned && (
              <>
                <li>Request an original digital PDF or Microsoft Word (`.docx`) file.</li>
                <li>If you only have a paper scan, run OCR (Adobe Acrobat or Google Drive OCR) before uploading.</li>
                <li>Ensure selectable text can be highlighted in your reader.</li>
              </>
            )}
            {isLanguage && (
              <>
                <li>Models are trained on English commercial legal syntax.</li>
                <li>Please upload an English translation or counterpart agreement.</li>
              </>
            )}
            {isCorrupted && (
              <>
                <li>Ensure the document is not password-encrypted.</li>
                <li>Verify the file opened correctly on your local device.</li>
              </>
            )}
            {!isScanned && !isLanguage && !isCorrupted && (
              <li>Check that the document size is under 20 MB and uses `.pdf` or `.docx` format.</li>
            )}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <span>Got it, try another file</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
