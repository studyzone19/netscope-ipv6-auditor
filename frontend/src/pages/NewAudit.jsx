import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Settings,
  Sparkles,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { createAudit, getAudit, analyzeUrl } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { UrlFixGuide } from '../components/UrlFixGuide';

const WORKFLOW_STAGES = [
  { id: 1, name: 'URL Validation', desc: 'Pre-flight DNS & SSRF protection checks' },
  { id: 2, name: 'Browser Discovery', desc: 'Playwright headless browser navigation' },
  { id: 3, name: 'Dependency Extraction', desc: 'Scripts, stylesheets, images & API capture' },
  { id: 4, name: 'IPv4 Measurements', desc: 'A records, TCP socket, TLS handshake & HTTP' },
  { id: 5, name: 'IPv6 Measurements', desc: 'AAAA records, TCP socket, TLS handshake & HTTP' },
  { id: 6, name: 'Failure Classification', desc: 'Root cause analysis & dual-stack parity' },
  { id: 7, name: 'Report Generation', desc: 'Comprehensive JSON & CSV dataset ready' },
];

export function NewAudit() {
  const [url, setUrl] = useState('');
  const [timeoutSec, setTimeoutSec] = useState(15);
  const [maxResources, setMaxResources] = useState(30);
  const [allowLab, setAllowLab] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const [activeAudit, setActiveAudit] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState(null);

  // Smart Typo Detection State
  const [typoInfo, setTypoInfo] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  const navigate = useNavigate();

  // Polling loop for active audit
  useEffect(() => {
    let timer = null;
    if (isAuditing && activeAudit?._id) {
      timer = setInterval(async () => {
        try {
          const res = await getAudit(activeAudit._id);
          if (res?.audit) {
            setActiveAudit(res.audit);
            if (res.audit.status === 'completed' || res.audit.status === 'failed') {
              setIsAuditing(false);
              clearInterval(timer);
            }
          }
        } catch (err) {
          console.warn('Error polling audit status', err);
        }
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAuditing, activeAudit?._id]);

  const handleSubmit = async (e, overrideUrl = null) => {
    e?.preventDefault();
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) return;

    setError(null);
    setTypoInfo(null);
    setDiagnostics(null);
    setIsAuditing(true);

    try {
      // 1. Run Pre-flight URL & Typo Check
      const preflight = await analyzeUrl(targetUrl);
      if (preflight.typoDetected || (preflight.diagnostics && preflight.diagnostics.stageIndex !== -1)) {
        setTypoInfo(preflight.typoInfo);
        setDiagnostics(preflight.diagnostics);
        setIsAuditing(false);
        return;
      }

      const result = await createAudit(targetUrl, {
        timeoutMs: timeoutSec * 1000,
        maxResources,
        allowLab,
      });

      if (result.audit) {
        setActiveAudit(result.audit);
      }
    } catch (err) {
      setError(err.message || 'Failed to start audit');
      setIsAuditing(false);
    }
  };

  const handleSelectQuickUrl = (presetUrl) => {
    setUrl(presetUrl);
    setTypoInfo(null);
    setDiagnostics(null);
    if (presetUrl.includes('5005')) {
      setAllowLab(true);
    } else {
      setAllowLab(false);
    }
  };

  // Determine current stage index (1-7)
  const getCurrentStageIndex = () => {
    if (!activeAudit) return 0;
    if (activeAudit.status === 'completed') return 7;
    if (activeAudit.status === 'failed') return -1;

    switch (activeAudit.status) {
      case 'validating': return 1;
      case 'discovering': return 2;
      case 'extracting': return 3;
      case 'measuring_ipv4': return 4;
      case 'measuring_ipv6': return 5;
      case 'classifying': return 6;
      default: return 1;
    }
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Initiate IPv6 Dependency Audit
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform real headless browser discovery and family-enforced socket measurements across every observed resource.
        </p>
      </div>

      {/* Smart Typo Detection & Error Fix Guide Card if mistake found */}
      {(typoInfo || (diagnostics && diagnostics.stageIndex !== -1)) && (
        <UrlFixGuide
          typoInfo={typoInfo}
          diagnostics={diagnostics}
          onApplySuggestion={(sugg) => {
            setUrl(sugg);
            setTypoInfo(null);
            setDiagnostics(null);
            handleSubmit(null, sugg);
          }}
          onRetryOriginal={() => {
            setTypoInfo(null);
            setDiagnostics(null);
            createAudit(url.trim(), { timeoutMs: timeoutSec * 1000, maxResources, allowLab })
              .then((res) => { if (res.audit) setActiveAudit(res.audit); })
              .catch((err) => setError(err.message));
          }}
        />
      )}

      {/* Main Input Card */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 md:p-8 shadow-xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Target Website URL
            </label>
            <div className="relative flex items-center">
              <Globe className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="https://example.com or https://prayag-hospital.vercel.app/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAuditing}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-navy-950 border border-navy-700 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500 font-mono">Quick Targets:</span>
            {[
              { label: '🏥 Prayag Hospital (Benchmark)', target: 'https://prayag-hospital.vercel.app/' },
              { label: '⚠️ Typo Test (prayag-hospitl)', target: 'https://prayag-hospitl.vercel.app/' },
              { label: 'Google (Dual-Stack)', target: 'https://www.google.com' },
              { label: 'GitHub (IPv4-Only Root)', target: 'https://github.com' },
              { label: 'Controlled Lab Target', target: 'http://127.0.0.1:5005' },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectQuickUrl(preset.target)}
                disabled={isAuditing}
                className="text-xs px-2.5 py-1 rounded-md bg-navy-800 hover:bg-navy-750 text-cyan-300 border border-navy-700 font-mono transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Advanced Options Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              {showOptions ? 'Hide Audit Options' : 'Show Advanced Measurement Options'}
            </button>

            {showOptions && (
              <div className="mt-3 p-4 rounded-xl bg-navy-950/60 border border-navy-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Max Resources to Measure</label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    value={maxResources}
                    onChange={(e) => setMaxResources(parseInt(e.target.value, 10))}
                    disabled={isAuditing}
                    className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-750 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Discovery Timeout (seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={timeoutSec}
                    onChange={(e) => setTimeoutSec(parseInt(e.target.value, 10))}
                    disabled={isAuditing}
                    className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-750 text-white font-mono"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={allowLab}
                      onChange={(e) => setAllowLab(e.target.checked)}
                      disabled={isAuditing}
                      className="rounded bg-navy-900 border-navy-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Allow Controlled Lab Mode</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isAuditing || !url.trim()}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all ${
                isAuditing
                  ? 'bg-navy-800 text-cyan-300 cursor-not-allowed border border-cyan-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 shadow-cyan-500/25 hover:scale-101 cursor-pointer'
              }`}
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Executing Pipeline ({activeAudit?.stage || 'Running'}... {activeAudit?.progress || 0}%)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-navy-950" />
                  <span>Start Comprehensive IPv6 Audit</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">Audit Failed or Rejected by Security Engine:</span>
              <span className="font-mono">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* 7-Stage Workflow Progress Stepper */}
      {activeAudit && (
        <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 md:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-navy-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  Audit Execution Pipeline
                </h3>
                <StatusBadge status={activeAudit.status} />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Target: {activeAudit.url}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-cyan-400 font-mono">
                {activeAudit.progress || 0}%
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">Pipeline Progress</span>
            </div>
          </div>

          {/* Stepper list */}
          <div className="space-y-3">
            {WORKFLOW_STAGES.map((st) => {
              const isPast = currentStageIndex > st.id || activeAudit.status === 'completed';
              const isCurrent = currentStageIndex === st.id && activeAudit.status !== 'completed';
              const isFailed = currentStageIndex === -1 && currentStageIndex === st.id;

              return (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                      : isPast
                      ? 'bg-navy-950/40 border-emerald-500/30 text-slate-300'
                      : 'bg-navy-950/20 border-navy-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                        isCurrent
                          ? 'bg-cyan-500 text-navy-950'
                          : isPast
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-navy-800 text-slate-500 border border-navy-700'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : st.id}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        {st.id}. {st.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{st.desc}</p>
                    </div>
                  </div>

                  <div>
                    {isCurrent && (
                      <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> In Progress
                      </span>
                    )}
                    {isPast && (
                      <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit Completed Action Bar */}
          {activeAudit.status === 'completed' && (
            <div className="pt-4 border-t border-navy-800 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Audit Completed Successfully!</h4>
                  <p className="text-xs font-mono mt-0.5 text-emerald-200/90">
                    Discovered {activeAudit.summary?.totalDiscovered || 0} resources.
                    IPv6 Reachability: {activeAudit.summary?.ipv6ReachabilityRate || 0}%.
                    Confirmed IPv6-specific failures: {activeAudit.summary?.confirmedIpv6SpecificFailures || 0}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => navigate(`/explorer?auditId=${activeAudit._id}`)}
                  className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Layers className="w-4 h-4" />
                  Explore Dependency Graph
                </button>
                <button
                  onClick={() => navigate(`/parity?auditId=${activeAudit._id}`)}
                  className="py-3 px-4 rounded-xl bg-navy-800 hover:bg-navy-750 text-cyan-300 border border-navy-700 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Compare IPv4 vs IPv6
                </button>
                <button
                  onClick={() => navigate(`/reports?auditId=${activeAudit._id}`)}
                  className="py-3 px-4 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 border border-navy-700 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Export JSON / CSV Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
