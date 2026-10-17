import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  XCircle,
  Terminal,
} from 'lucide-react';

export function UrlFixGuide({ typoInfo, diagnostics, onApplySuggestion, onRetryOriginal }) {
  if (!typoInfo && (!diagnostics || diagnostics.stageIndex === -1)) {
    return null;
  }

  const origUrl = typoInfo?.originalUrl || diagnostics?.originalUrl || '';
  const suggUrl = typoInfo?.suggestedUrl || '';
  const diff = typoInfo?.diff;

  // Split original URL to highlight typo
  const renderHighlightedOriginal = () => {
    if (!diff || !diff.removed) {
      return <span className="font-mono text-rose-300 font-bold">{origUrl}</span>;
    }

    const startIdx = diff.index;
    const before = origUrl.slice(0, startIdx);
    const typoSegment = diff.removed;
    const after = origUrl.slice(startIdx + typoSegment.length);

    return (
      <span className="font-mono text-slate-200">
        <span>{before}</span>
        <span className="px-1 py-0.5 rounded bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold underline decoration-rose-500 underline-offset-4">
          {typoSegment}
        </span>
        <span>{after}</span>
      </span>
    );
  };

  const renderHighlightedSuggested = () => {
    if (!diff || !diff.added) {
      return <span className="font-mono text-emerald-300 font-bold">{suggUrl}</span>;
    }

    const startIdx = diff.index;
    const before = suggUrl.slice(0, startIdx);
    const addedSegment = diff.added;
    const after = suggUrl.slice(startIdx + addedSegment.length);

    return (
      <span className="font-mono text-slate-200">
        <span>{before}</span>
        <span className="px-1 py-0.5 rounded bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold underline decoration-emerald-500 underline-offset-4">
          {addedSegment}
        </span>
        <span>{after}</span>
      </span>
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border-2 border-rose-500/50 shadow-2xl space-y-4">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 uppercase tracking-wider">
                SMART URL TYPO & ERROR GUIDE
              </span>
              <span className="text-xs font-mono text-slate-400">
                {typoInfo?.errorCategory || 'PRE-FLIGHT FAILURE'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              {typoInfo?.errorTitle || 'Pre-flight Network Diagnostics Failed'}
            </h3>
          </div>
        </div>

        {suggUrl && onApplySuggestion && (
          <button
            onClick={() => onApplySuggestion(suggUrl)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-navy-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-102 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-navy-950" />
            <span>Analyze Corrected URL</span>
          </button>
        )}
      </div>

      {/* Side-by-Side Comparison Card */}
      {suggUrl && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-navy-950 border border-rose-500/30 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> ORIGINAL INPUT (MISTAKE SUSPECTED)
            </span>
            <div className="text-xs break-all">{renderHighlightedOriginal()}</div>
            {typoInfo?.suspectedTypo && (
              <p className="text-[10px] text-slate-400 font-mono">
                Suspected typo: <strong className="text-rose-300">"{typoInfo.suspectedTypo}"</strong> at character #{typoInfo.characterPosition || 1}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> SUGGESTED CORRECTION
            </span>
            <div className="text-xs break-all">{renderHighlightedSuggested()}</div>
            <p className="text-[10px] text-slate-400 font-mono">
              Confidence: <span className="text-emerald-400 font-bold">High (Levenshtein Distance: {typoInfo?.distance || 1})</span>
            </p>
          </div>
        </div>
      )}

      {/* Diagnostic Stage Pipeline Breakdown */}
      {diagnostics?.stages && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> ACTUAL FAILURE STAGE DIAGNOSTICS
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            {diagnostics.stages.map((stage, idx) => {
              const isFailed = stage.status === 'failed';
              const isPassed = stage.status === 'passed';
              return (
                <div
                  key={stage.name}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isFailed
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : isPassed
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-navy-800 bg-navy-950/60 text-slate-500'
                  }`}
                >
                  <span className="text-[9px] block text-slate-400 mb-0.5">Stage {idx + 1}</span>
                  <p className="font-semibold text-[11px] truncate">{stage.name}</p>
                  <span className={`text-[10px] font-bold mt-1 inline-block ${isFailed ? 'text-rose-400' : isPassed ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {stage.status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanations: Simple English & Hinglish */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400">
            🇬🇧 What Happened (Simple English)
          </span>
          <p className="text-slate-300 leading-relaxed">
            {typoInfo?.explanationEn || diagnostics?.summary || 'The website could not be contacted due to a DNS or network problem.'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-teal-400">
            🇮🇳 Saral Hinglish Mein Samjhein
          </span>
          <p className="text-slate-300 leading-relaxed">
            {typoInfo?.explanationHi || 'Website ka address galat ya unavailable hai. DNS server ko is domain ka koi A ya AAAA record nahi mila.'}
          </p>
        </div>
      </div>

      {/* Step-by-Step Fix List */}
      {typoInfo?.stepByStepFix && (
        <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> HOW TO FIX THIS STEP-BY-STEP
          </span>
          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 font-mono">
            {typoInfo.stepByStepFix.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
        <span className="text-[11px] text-slate-400">
          ⚠️ NetScope never silently replaces URLs. You maintain complete control over all scans.
        </span>
        <div className="flex items-center gap-2">
          {onRetryOriginal && (
            <button
              onClick={onRetryOriginal}
              className="px-3.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Original URL</span>
            </button>
          )}
          {suggUrl && onApplySuggestion && (
            <button
              onClick={() => onApplySuggestion(suggUrl)}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-navy-950" />
              <span>Audit Corrected: {typoInfo?.referenceMatch || suggUrl}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
