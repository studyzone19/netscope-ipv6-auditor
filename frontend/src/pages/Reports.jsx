import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  FileCode,
  Globe,
  CheckCircle,
  Copy,
  Check,
  Eye,
  Info,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import {
  listAudits,
  getAudit,
  getAuditFindings,
  getAuditReport,
  getAuditNotes,
  getReportJsonUrl,
  getReportCsvUrl,
} from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { SmartFindingsList } from '../components/SmartFindingsList';
import { TrustSignalsCard } from '../components/TrustSignalsCard';
import { EasyNotesView } from '../components/EasyNotesView';

export function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [audits, setAudits] = useState([]);
  const [selectedAuditId, setSelectedAuditId] = useState(searchParams.get('auditId') || '');
  const [audit, setAudit] = useState(null);

  // Active view tab: 'findings' | 'easynotes' | 'trust' | 'export' | 'table'
  const [activeTab, setActiveTab] = useState('findings');

  const [findings, setFindings] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [easyNotes, setEasyNotes] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Load audits list
  useEffect(() => {
    listAudits(1, 25).then((data) => {
      const list = data.audits || [];
      setAudits(list);
      if (!selectedAuditId && list.length > 0) {
        setSelectedAuditId(list[0]._id);
        setSearchParams({ auditId: list[0]._id });
      }
    });
  }, []);

  // Fetch full audit details, smart findings, report, and easy notes
  useEffect(() => {
    if (!selectedAuditId) return;
    setLoading(true);

    Promise.allSettled([
      getAudit(selectedAuditId),
      getAuditFindings(selectedAuditId),
      getAuditReport(selectedAuditId),
      getAuditNotes(selectedAuditId),
    ])
      .then(([auditRes, findingsRes, reportRes, notesRes]) => {
        if (auditRes.status === 'fulfilled') setAudit(auditRes.value.audit);
        if (findingsRes.status === 'fulfilled') setFindings(findingsRes.value.findings || []);
        if (reportRes.status === 'fulfilled') setReportData(reportRes.value);
        if (notesRes.status === 'fulfilled') setEasyNotes(notesRes.value.easyNotes);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching audit report data:', err);
        setLoading(false);
      });
  }, [selectedAuditId]);

  const handleAuditSelect = (id) => {
    setSelectedAuditId(id);
    setSearchParams({ auditId: id });
  };

  const handleCopyJson = () => {
    if (reportData) {
      navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase tracking-wider">
              EASY EXPLANATION & AUDIT REPORT
            </span>
            <span className="text-xs font-mono text-slate-400">
              Deterministic Root Cause Explanations
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 font-mono">
            Smart Website Audit & Easy Explanation Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Plain English & Hinglish explanations of what worked, what failed, why it happened, and how to fix it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <select
            value={selectedAuditId}
            onChange={(e) => handleAuditSelect(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-navy-900 border border-navy-750 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 max-w-[260px]"
          >
            {audits.map((a) => (
              <option key={a._id} value={a._id}>
                {a.targetHost} ({new Date(a.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Audit Executive Summary Card */}
      {audit && (
        <div className="rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-cyan-500/30 p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                AUDIT ID: {audit._id}
              </span>
              <StatusBadge status={audit.status} size="sm" />
            </div>
            <h2 className="text-xl font-bold text-white font-mono tracking-tight">{audit.url}</h2>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-300">
              <span>Discovered: <strong className="text-white">{audit.summary?.totalDiscovered || 0}</strong></span>
              <span>Tested: <strong className="text-white">{audit.summary?.totalTested || 0}</strong></span>
              <span className="text-emerald-400 font-bold">
                IPv6 Reachability: {audit.summary?.ipv6ReachabilityRate || 0}%
              </span>
              <span className="text-rose-400 font-bold">
                IPv6 Failures: {audit.summary?.confirmedIpv6SpecificFailures || 0}
              </span>
              <span className="text-cyan-400">
                Coverage: {audit.summary?.measurementCoverageRate || 100}%
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate(`/explorer?auditId=${audit._id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-medium transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Explore Graph</span>
            </button>
            <a
              href={getReportJsonUrl(audit._id)}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </a>
            <a
              href={getReportCsvUrl(audit._id)}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </a>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-navy-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'findings'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-navy-850'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Smart Findings ({findings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('easynotes')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'easynotes'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold shadow-[0_0_12px_rgba(20,184,166,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-navy-850'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-400" />
          <span>Easy Notes (English + Hinglish)</span>
        </button>

        <button
          onClick={() => setActiveTab('trust')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'trust'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-bold shadow-[0_0_12px_rgba(139,92,246,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-navy-850'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          <span>Website Health & Trust Signals</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'table'
              ? 'bg-navy-800 text-white border border-slate-700 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-navy-850'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          <span>Resources Dataset</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'export'
              ? 'bg-navy-800 text-white border border-slate-700 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-navy-850'
          }`}
        >
          <FileCode className="w-4 h-4 text-slate-400" />
          <span>Raw JSON Artifact</span>
        </button>
      </div>

      {/* Main Tab Content Display */}
      {loading ? (
        <div className="p-16 text-center text-xs font-mono text-cyan-400 space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Compiling smart explanations & findings...</p>
        </div>
      ) : activeTab === 'findings' ? (
        <div className="space-y-6">
          <SmartFindingsList findings={findings} auditId={selectedAuditId} />
        </div>
      ) : activeTab === 'easynotes' ? (
        <div className="space-y-6">
          <EasyNotesView easyNotes={easyNotes} />
        </div>
      ) : activeTab === 'trust' ? (
        <div className="space-y-6">
          <TrustSignalsCard trustSignals={reportData?.trustSignals} />
        </div>
      ) : activeTab === 'table' ? (
        <div className="rounded-2xl bg-navy-900 border border-navy-750 shadow-xl overflow-hidden p-4">
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-navy-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Resource URL</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">A Records</th>
                  <th className="py-2.5 px-3">AAAA Records</th>
                  <th className="py-2.5 px-3">IPv4 Result</th>
                  <th className="py-2.5 px-3">IPv6 Result</th>
                  <th className="py-2.5 px-3">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {reportData?.resources?.map((r) => (
                  <tr key={r.resourceId} className="hover:bg-navy-800/40">
                    <td className="py-2.5 px-3 truncate max-w-[240px]" title={r.url}>
                      {r.url}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-slate-400 text-[10px]">
                      {r.resourceType}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-400">{r.dns?.aRecords?.length || 0}</td>
                    <td className="py-2.5 px-3 text-teal-400">{r.dns?.aaaaRecords?.length || 0}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={r.ipv4?.outcome || 'Untested'} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={r.ipv6?.outcome || 'Untested'} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={r.classification?.overall || 'Untested'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-navy-900 border border-navy-750 shadow-xl overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Complete JSON Export Artifact</span>
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-750 text-xs font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy JSON
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px]">
            {reportData ? JSON.stringify(reportData, null, 2) : 'No report data'}
          </pre>
        </div>
      )}

      {/* Test Limitations & Methodology Note */}
      {reportData?.testLimitations && (
        <div className="p-4 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" /> EMPIRICAL TEST LIMITATIONS & METHODOLOGY
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            {reportData.testLimitations.map((lim, i) => (
              <div key={i} className="p-3 rounded-xl bg-navy-950 border border-navy-850 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">{lim.aspect}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-900 text-cyan-300 border border-navy-800">
                    {lim.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{lim.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
