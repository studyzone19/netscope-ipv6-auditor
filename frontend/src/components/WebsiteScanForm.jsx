import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  XCircle,
  Shield,
  Loader2,
} from 'lucide-react';
import { createAudit, analyzeUrl, getAudit } from '../api/client';
import { UrlFixGuide } from './UrlFixGuide';

export function WebsiteScanForm({ onAuditStarted, className = '' }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Typo & Pre-flight diagnostics state
  const [typoInfo, setTypoInfo] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timeoutMs, setTimeoutMs] = useState(15000);
  const [maxResources, setMaxResources] = useState(40);
  const [enablePreflight, setEnablePreflight] = useState(true);

  const navigate = useNavigate();

  const handleStartAnalysis = async (targetUrl = url) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError('Please enter a website URL.');
      return;
    }

    setError(null);
    setTypoInfo(null);
    setDiagnostics(null);
    setLoading(true);
    setProgress(15);
    setStatusMessage('1/7: Validating URL syntax & DNS pre-flight...');

    try {
      // 1. Run Pre-flight URL & Typo Check if enabled
      if (enablePreflight) {
        const preflight = await analyzeUrl(trimmed);
        if (preflight.typoDetected || (preflight.diagnostics && preflight.diagnostics.stageIndex !== -1)) {
          setTypoInfo(preflight.typoInfo);
          setDiagnostics(preflight.diagnostics);
          setLoading(false);
          setStatusMessage('');
          return;
        }
      }

      // 2. Submit Audit to Real Backend
      setProgress(35);
      setStatusMessage('2/7: Launching Playwright browser session...');

      const response = await createAudit(trimmed, {
        timeoutMs,
        maxResources,
        allowLab: true,
      });

      const auditId = response.audit?._id;
      if (!auditId) {
        throw new Error('Audit ID was not returned by server.');
      }

      if (onAuditStarted) {
        onAuditStarted(auditId);
      }

      // 3. Poll briefly to show actual backend progress stages
      setProgress(55);
      setStatusMessage('3/7: Extracting observed dependencies & sockets...');

      let pollCount = 0;
      const interval = setInterval(async () => {
        pollCount++;
        try {
          const fresh = await getAudit(auditId);
          const a = fresh.audit;
          if (a) {
            setProgress(a.progress || 60);
            setStatusMessage(a.stage || 'Executing dual-stack measurements...');
            if (a.status === 'completed' || a.status === 'failed') {
              clearInterval(interval);
              setLoading(false);
              navigate(`/reports?auditId=${auditId}`);
            }
          }
        } catch (_) {}

        if (pollCount > 25) {
          clearInterval(interval);
          setLoading(false);
          navigate(`/reports?auditId=${auditId}`);
        }
      }, 1200);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Audit failed to start.');
    }
  };

  const handleApplySuggestion = (suggestedUrl) => {
    setUrl(suggestedUrl);
    setTypoInfo(null);
    setDiagnostics(null);
    handleStartAnalysis(suggestedUrl);
  };

  const handleCancel = () => {
    setLoading(false);
    setProgress(0);
    setStatusMessage('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* URL Input Form Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-cyan-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase tracking-wider">
                SMART AUDIT ENGINE
              </span>
              <span className="text-xs font-mono text-slate-400">
                Playwright + Dual-Stack Socket Testing
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
              Analyze Any Website for IPv6 Readiness & Dependency Health
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Options' : 'Advanced Options'}</span>
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartAnalysis();
          }}
          className="space-y-3"
        >
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                placeholder="https://example.com (e.g. https://wikipedia.org)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-950 border border-navy-750 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-50 text-navy-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-navy-950" />
                  <span>Analyze Website</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 pt-1">
            <span className="text-[11px] text-slate-500">Quick Test Targets:</span>
            {[
              { label: '🌐 Wikipedia (Dual-Stack)', url: 'https://www.wikipedia.org' },
              { label: '⚠️ Typo Demo (gogle.com)', url: 'https://gogle.com' },
              { label: '🔍 Google (Dual-Stack)', url: 'https://google.com' },
              { label: '🧪 Controlled Lab', url: 'http://127.0.0.1:5005' },
            ].map((chip) => (
              <button
                key={chip.url}
                type="button"
                onClick={() => {
                  setUrl(chip.url);
                  handleStartAnalysis(chip.url);
                }}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg bg-navy-950 border border-navy-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all text-[11px] cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Advanced Options Drawer */}
          {showAdvanced && (
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Session Timeout ({timeoutMs / 1000}s)</label>
                <input
                  type="range"
                  min="5000"
                  max="30000"
                  step="5000"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Max Resources ({maxResources})</label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="10"
                  value={maxResources}
                  onChange={(e) => setMaxResources(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="preflight"
                  checked={enablePreflight}
                  onChange={(e) => setEnablePreflight(e.target.checked)}
                  className="rounded border-navy-700 bg-navy-900 text-cyan-400 focus:ring-0"
                />
                <label htmlFor="preflight" className="text-slate-300 cursor-pointer">
                  Smart Typo & Pre-flight Diagnostics
                </label>
              </div>
            </div>
          )}
        </form>

        {/* Live Scan Progress Indicator */}
        {loading && (
          <div className="p-4 rounded-xl bg-navy-950 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-300 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {statusMessage}
              </span>
              <span className="text-slate-400">{progress}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-navy-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-slate-500">
                Measuring DNS, TCP Handshakes, TLS ciphers & HTTP across IPv4 and IPv6
              </span>
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Cancel Scan
              </button>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Smart Typo Detection & Error Fix Guide Card */}
      {(typoInfo || (diagnostics && diagnostics.stageIndex !== -1)) && (
        <UrlFixGuide
          typoInfo={typoInfo}
          diagnostics={diagnostics}
          onApplySuggestion={handleApplySuggestion}
          onRetryOriginal={() => {
            setEnablePreflight(false);
            handleStartAnalysis(url);
          }}
        />
      )}
    </div>
  );
}
