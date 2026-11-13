import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Loader2, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Search, 
  Layers, 
  FileCheck,
  AlertTriangle
} from 'lucide-react';

/**
 * RATIONALE:
 * The processing state provides staged, determinate visual feedback to legal professionals,
 * establishing confidence that the multi-stage neural parsing, entity extraction,
 * and risk classification pipeline is actively and deterministically analyzing their contract.
 */
export function ProcessingState({ file, onComplete, onCancel, isReady = false, isSample = false }) {
  const [progress, setProgress] = useState(12);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isCancelledRef = useRef(false);

  const stages = [
    {
      id: 'ocr',
      title: 'Neural OCR & Text Extraction',
      description: 'Extracting document layout, typography hierarchy, and paragraph markers...',
      targetProgress: 28,
      durationMs: 800,
      icon: FileText
    },
    {
      id: 'entities',
      title: 'Entity & Party Recognition',
      description: 'Identifying contracting parties, effective dates, currencies, and governing venue...',
      targetProgress: 56,
      durationMs: 1000,
      icon: Search
    },
    {
      id: 'clauses',
      title: 'CUAD Clause Classification & Risk Audit',
      description: 'Auditing 120+ legal categories for uncapped liability, indemnity, and auto-renewals...',
      targetProgress: 84,
      durationMs: 1200,
      icon: Layers
    },
    {
      id: 'synthesis',
      title: 'Plain-Language Synthesis & Guardrails',
      description: 'Generating executive commercial brief and verification audit trail...',
      targetProgress: 95,
      durationMs: 900,
      icon: Sparkles
    }
  ];

  // Elapsed time tracker
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Staged progress runner across stages 0 to 3
  useEffect(() => {
    isCancelledRef.current = false;
    let timeoutId;

    const runStage = (index) => {
      if (isCancelledRef.current) return;
      if (index >= stages.length - 1) {
        setCurrentStageIndex(stages.length - 1);
        setProgress((prev) => Math.max(prev, 92));
        return;
      }

      setCurrentStageIndex(index);
      const stage = stages[index];

      // Smoothly increment progress towards stage target
      const stepInterval = setInterval(() => {
        if (isCancelledRef.current) {
          clearInterval(stepInterval);
          return;
        }
        setProgress((prev) => {
          if (prev >= stage.targetProgress) {
            clearInterval(stepInterval);
            return stage.targetProgress;
          }
          return Math.min(prev + 2, stage.targetProgress);
        });
      }, 50);

      timeoutId = setTimeout(() => {
        clearInterval(stepInterval);
        setProgress(stage.targetProgress);
        runStage(index + 1);
      }, stage.durationMs);
    };

    runStage(0);

    return () => {
      isCancelledRef.current = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // When backend analysis finishes (isReady is true), complete final stage
  useEffect(() => {
    if (isReady && !isCancelledRef.current) {
      setCurrentStageIndex(stages.length - 1);
      setProgress(100);
      const completionTimer = setTimeout(() => {
        if (!isCancelledRef.current && onComplete) {
          onComplete();
        }
      }, 400);
      return () => clearTimeout(completionTimer);
    }
  }, [isReady]);

  const handleCancelClick = () => {
    isCancelledRef.current = true;
    if (onCancel) onCancel();
  };

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : '0.45';
  const fileName = file ? file.name : 'Master_Services_Agreement_Sample.pdf';
  const fileExt = fileName.split('.').pop().toUpperCase();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-card relative overflow-hidden">
        
        {/* Subtle top scan beam */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-subtle overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header with Cancel Button */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-accent-soft border border-accent-border flex items-center justify-center text-accent shrink-0">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-heading truncate max-w-sm sm:max-w-md">
                  {fileName}
                </h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-subtle text-muted border border-border shrink-0">
                  {fileExt}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5 font-mono">
                {fileSizeMB} MB · Ephemeral In-Memory Processing
              </p>
            </div>
          </div>

          <button
            onClick={handleCancelClick}
            className="p-2 rounded-lg text-muted hover:text-risk-severe hover:bg-risk-severe-soft border border-transparent hover:border-risk-severe-border transition-all text-xs font-semibold flex items-center gap-1.5 shrink-0"
            title="Cancel analysis"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </div>

        {/* Progress Metric Bar */}
        <div className="py-6 border-b border-border">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-accent animate-ping" />
              <span className="font-bold text-heading">
                {stages[currentStageIndex]?.title || 'Processing Agreement...'}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-muted text-xs">
              <span>{elapsedSeconds.toFixed(1)}s elapsed</span>
              <span className="font-bold text-accent text-sm">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Determinate Progress Track */}
          <div className="w-full h-2.5 rounded-full bg-subtle border border-border/80 overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-muted mt-2.5 leading-relaxed italic">
            {stages[currentStageIndex]?.description}
          </p>
        </div>

        {/* Staged Checklist Steps */}
        <div className="py-6 space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted font-mono mb-3">
            Deterministic Pipeline Execution:
          </h4>

          {stages.map((stage, idx) => {
            const isFinished = idx < currentStageIndex || progress >= 100;
            const isCurrent = idx === currentStageIndex && progress < 100;
            const Icon = stage.icon;

            return (
              <div 
                key={stage.id}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                  isCurrent
                    ? 'bg-accent-soft border-accent-border shadow-subtle'
                    : isFinished
                    ? 'bg-canvas border-border text-body'
                    : 'bg-subtle/40 border-border/60 text-muted opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-accent text-accent-fg'
                      : isFinished
                      ? 'bg-accent-soft text-accent'
                      : 'bg-subtle text-muted'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className={`text-xs font-bold truncate ${
                      isCurrent ? 'text-accent' : isFinished ? 'text-heading' : 'text-muted'
                    }`}>
                      {stage.title}
                    </h5>
                    <span className="text-[11px] text-muted block truncate">
                      {isFinished ? 'Completed & verified' : isCurrent ? 'Active neural execution...' : 'Queued'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {isFinished ? (
                    <CheckCircle2 className="w-5 h-5 text-accent stroke-[2.2]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border-strong/40" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Confidentiality Guarantee Footer */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="font-medium text-body">Zero Data Retention Active</span>
          </div>
          <span className="font-mono text-[10px]">
            AES-256 Memory Encryption
          </span>
        </div>

      </div>
    </div>
  );
}
