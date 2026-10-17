import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  Search,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  Shield,
  Layers,
  Globe,
  Activity,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SEVERITY_COLORS = {
  Critical: 'border-rose-500/50 bg-rose-500/15 text-rose-300',
  High: 'border-amber-500/50 bg-amber-500/15 text-amber-300',
  Medium: 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300',
  Low: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  Informational: 'border-slate-600 bg-slate-800 text-slate-300',
};

const STATUS_BADGES = {
  Confirmed: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  Warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Possible Issue': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  Passed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  Untested: 'bg-slate-700/50 text-slate-400 border-slate-600',
  Inconclusive: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
};

export function SmartFindingsList({ findings = [], auditId }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(findings[0]?.id || null);

  const navigate = useNavigate();

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      let matchesCat = true;
      if (selectedCategory === 'ipv6') matchesCat = f.category === 'IPv6' || f.category === 'TCP';
      else if (selectedCategory === 'dns') matchesCat = f.category === 'DNS';
      else if (selectedCategory === 'security') matchesCat = f.category === 'Security';
      else if (selectedCategory === 'browser') matchesCat = f.category === 'Browser';
      else if (selectedCategory === 'passed') matchesCat = f.status === 'Passed';
      else if (selectedCategory === 'failed') matchesCat = f.status === 'Confirmed' || f.status === 'Warning';

      let matchesSev = selectedSeverity === 'all' || f.severity === selectedSeverity;

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch =
          f.title?.toLowerCase().includes(q) ||
          f.affectedUrl?.toLowerCase().includes(q) ||
          f.simpleEnglish?.toLowerCase().includes(q) ||
          f.simpleHinglish?.toLowerCase().includes(q);
      }

      return matchesCat && matchesSev && matchesSearch;
    });
  }, [findings, selectedCategory, selectedSeverity, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and Category Filter Toolbar */}
      <div className="p-3.5 rounded-2xl bg-navy-900 border border-navy-750 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search findings, keywords, URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-navy-950 border border-navy-750 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {[
              { id: 'all', label: 'All Findings' },
              { id: 'failed', label: '🔴 Confirmed Failures' },
              { id: 'ipv6', label: '⚡ IPv6 Transport' },
              { id: 'dns', label: '🌐 DNS AAAA' },
              { id: 'security', label: '🛡️ Security & Trust' },
              { id: 'browser', label: '📦 Dependencies' },
              { id: 'passed', label: '🟢 Passed Checks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedCategory === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing <strong className="text-white">{filteredFindings.length}</strong> of {findings.length} findings
        </span>
      </div>

      {/* Findings Accordion List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="text-center py-10 rounded-2xl bg-navy-900 border border-navy-800 p-6 space-y-2">
            <CheckCircle className="w-8 h-8 text-cyan-400 mx-auto" />
            <p className="text-sm font-semibold text-white">No findings matching your filter criteria</p>
            <p className="text-xs text-slate-400">Try selecting "All Findings" or clearing the search query.</p>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.id;
            const isPassed = finding.status === 'Passed';
            const isConfirmed = finding.status === 'Confirmed';

            return (
              <div
                key={finding.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isConfirmed
                    ? 'border-rose-500/40 bg-navy-900/95 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                    : isPassed
                    ? 'border-emerald-500/30 bg-navy-900/90'
                    : 'border-navy-750 bg-navy-900/90 hover:border-slate-700'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                  className="p-4 cursor-pointer flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        isConfirmed
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : isPassed
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-navy-950 border-navy-800 text-cyan-400'
                      }`}
                    >
                      {isConfirmed ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isPassed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                            STATUS_BADGES[finding.status] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {finding.status}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-medium ${
                            SEVERITY_COLORS[finding.severity] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {finding.severity}
                        </span>
                        <span className="text-[9px] font-mono uppercase text-slate-400">
                          {finding.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white font-mono truncate">
                        {finding.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      {isExpanded ? 'Collapse' : 'Details & Fix'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Accordion Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-navy-800/80 space-y-4 text-xs font-mono">
                    {/* Affected URL Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-navy-950 border border-navy-800">
                      <div className="overflow-hidden">
                        <span className="text-[9px] text-slate-500 block uppercase">Affected Target</span>
                        <span className="text-cyan-300 truncate block font-bold text-xs" title={finding.affectedUrl}>
                          {finding.affectedUrl}
                        </span>
                      </div>
                      {auditId && (
                        <button
                          onClick={() => navigate(`/explorer?auditId=${auditId}`)}
                          className="px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 flex items-center gap-1.5 text-[10px] cursor-pointer"
                        >
                          <Layers className="w-3 h-3" />
                          <span>View in Graph</span>
                        </button>
                      )}
                    </div>

                    {/* Technical Description vs Plain English vs Hinglish */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                      <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                          🇬🇧 What this means in simple English
                        </span>
                        <p className="text-slate-200 text-xs leading-relaxed">
                          {finding.simpleEnglish}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-teal-400 flex items-center gap-1">
                          🇮🇳 Saral Hinglish Explanation
                        </span>
                        <p className="text-slate-200 text-xs leading-relaxed">
                          {finding.simpleHinglish}
                        </p>
                      </div>
                    </div>

                    {/* Why It Matters & Visitor Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-400">Why It Matters</span>
                        <p className="text-slate-300 font-sans text-xs">{finding.whyItMatters}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-rose-400">Visitor Impact</span>
                        <p className="text-slate-300 font-sans text-xs">{finding.visitorImpact}</p>
                      </div>
                    </div>

                    {/* Actual Evidence Collected */}
                    {finding.actualEvidence && (
                      <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" /> ACTUAL EVIDENCE COLLECTED
                        </span>
                        <pre className="p-2.5 rounded-lg bg-navy-900 border border-navy-850 text-slate-300 text-[11px] overflow-x-auto leading-relaxed">
                          {JSON.stringify(finding.actualEvidence, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Likely Cause */}
                    {finding.likelyCause && (
                      <div className="p-3 rounded-xl bg-navy-950/80 border border-navy-800 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Likely Cause:</span>
                        <span className="text-slate-200 font-sans text-xs">{finding.likelyCause.cause}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border ml-auto shrink-0 ${
                            finding.likelyCause.isConfirmed
                              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                              : 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                          }`}
                        >
                          {finding.likelyCause.isConfirmed ? 'Confirmed Cause' : 'Suspected Cause'}
                        </span>
                      </div>
                    )}

                    {/* Step-by-Step Fix Instructions */}
                    {finding.stepByStepFix && finding.stepByStepFix.length > 0 && (
                      <div className="p-4 rounded-xl bg-navy-950/90 border border-navy-800 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> STEP-BY-STEP FIX INSTRUCTIONS
                        </span>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-200 font-sans">
                          {finding.stepByStepFix.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Example Terminal Commands & Verification */}
                    {finding.exampleCommands && finding.exampleCommands.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-violet-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" /> EXAMPLE VERIFICATION COMMANDS
                        </span>
                        <div className="space-y-1">
                          {finding.exampleCommands.map((cmd, i) => (
                            <code
                              key={i}
                              className="block p-2 rounded bg-navy-900 border border-navy-850 text-cyan-300 text-xs select-all"
                            >
                              $ {cmd}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
