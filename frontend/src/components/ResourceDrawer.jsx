import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Server,
  ShieldCheck,
  Zap,
  Globe,
  Info,
  ArrowRight,
  AlertOctagon,
  Clock,
  HelpCircle,
  FileCode,
  FileText,
  Layers,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function ResourceDrawer({ node, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!node) return null;

  const data = node.data;
  const m = data.measurement || {};
  const dns = m.dns || {};
  const ipv4 = m.ipv4 || {};
  const ipv6 = m.ipv6 || {};
  const classification = m.classification || {};

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-xl bg-navy-900/98 backdrop-blur-xl border-l border-navy-750 shadow-2xl flex flex-col transition-all animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-5 border-b border-navy-750 flex items-start justify-between bg-navy-950/60">
        <div className="space-y-1.5 overflow-hidden pr-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {data.resourceType}
            </span>
            <StatusBadge
              status={data.overallStatus}
              isIpv6SpecificFailure={data.isIpv6SpecificFailure}
              size="sm"
            />
            {data.isThirdParty && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                Third-Party Origin
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white truncate font-mono">
            {data.pathname || data.hostname}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono truncate">
            <span className="truncate max-w-[320px]">{data.url}</span>
            <button
              onClick={handleCopyUrl}
              className="p-1 hover:text-cyan-400 transition-colors"
              title="Copy URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-cyan-400 transition-colors"
              title="Open resource in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Beginner Explainer: What is this dependency? */}
        <div className="p-3.5 rounded-xl bg-navy-950/70 border border-navy-800 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono">
            <Info className="w-3.5 h-3.5" />
            <span>Dependency Overview</span>
          </div>
          <p className="leading-relaxed">
            This <strong>{data.resourceType}</strong> was observed during the browser session. If this sub-resource fails on IPv6, users on pure IPv6 networks may experience broken layouts, failed scripts, or missing images.
          </p>
        </div>

        {/* Scientific Classification & Advice */}
        <div
          className={`p-4 rounded-xl border ${
            data.isIpv6SpecificFailure
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : data.overallStatus === 'Passed'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-navy-800/80 border-navy-700 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-sm mb-1.5">
            <AlertOctagon className="w-4 h-4" />
            <span>Root Cause & Measurement Verdict</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300 mb-3">
            {classification.explanation ||
              'Awaiting complete classification metrics from measurement engine.'}
          </p>

          {classification.recommendedNextStep && (
            <div className="pt-3 border-t border-navy-750">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-1 font-mono">
                <ArrowRight className="w-3 h-3" /> Recommended DevOps Next Step
              </span>
              <p className="text-xs font-mono text-cyan-200/90 leading-relaxed">
                {classification.recommendedNextStep}
              </p>
            </div>
          )}
        </div>

        {/* Protocol Parity Side-by-Side Comparison */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Side-by-Side Transport Evidence
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              Isolated Sockets
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* IPv4 Side */}
            <div className="p-4 rounded-xl bg-navy-800/60 border border-navy-750 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-navy-750">
                <span className="text-xs font-bold text-slate-200 font-mono">IPv4 (Legacy)</span>
                <StatusBadge status={ipv4.outcome || 'Untested'} size="sm" />
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Target IPv4 IP:</span>
                  <span className="text-slate-200">{ipv4.destinationIp || 'None resolved'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">TCP 3-Way Handshake:</span>
                  <span className={ipv4.tcpConnected ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                    {ipv4.tcpConnected ? `${ipv4.tcpDurationMs}ms (Connected)` : 'Failed / Reset'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">TLS 1.3 Negotiation:</span>
                  <span className={ipv4.tlsHandshake ? 'text-emerald-400' : 'text-slate-400'}>
                    {ipv4.tlsHandshake ? `${ipv4.tlsDurationMs}ms (${ipv4.tlsCipher || 'TLS'})` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">HTTP Response Code:</span>
                  <span className="text-slate-200">{ipv4.httpStatusCode ? `HTTP ${ipv4.httpStatusCode}` : 'None'}</span>
                </div>
              </div>
            </div>

            {/* IPv6 Side */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                data.isIpv6SpecificFailure
                  ? 'bg-rose-500/5 border-rose-500/30'
                  : 'bg-navy-800/60 border-navy-750'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-navy-750">
                <span className="text-xs font-bold text-slate-200 font-mono">IPv6 (Next-Gen)</span>
                <StatusBadge
                  status={ipv6.outcome || 'Untested'}
                  isIpv6SpecificFailure={data.isIpv6SpecificFailure}
                  size="sm"
                />
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Target IPv6 IP:</span>
                  <span className="text-slate-200 truncate block" title={ipv6.destinationIp}>
                    {ipv6.destinationIp || 'No AAAA record'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">TCP 3-Way Handshake:</span>
                  <span className={ipv6.tcpConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {ipv6.tcpConnected ? `${ipv6.tcpDurationMs}ms (Connected)` : 'Failed / Dropped'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">TLS 1.3 Negotiation:</span>
                  <span className={ipv6.tlsHandshake ? 'text-emerald-400' : 'text-slate-400'}>
                    {ipv6.tlsHandshake ? `${ipv6.tlsDurationMs}ms (${ipv6.tlsCipher || 'TLS'})` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">HTTP Response Code:</span>
                  <span className="text-slate-200">{ipv6.httpStatusCode ? `HTTP ${ipv6.httpStatusCode}` : 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DNS Evidence Details */}
        <div className="p-4 rounded-xl bg-navy-800/60 border border-navy-750 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-teal-400" /> DNS Evidence
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              Lookup: {dns.lookupDurationMs || 0}ms
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <span className="text-[11px] font-mono text-slate-400 flex items-center justify-between mb-1">
                <span>A Records (IPv4):</span>
                <span className="text-cyan-400 font-bold">{dns.aRecords?.length || 0} published</span>
              </span>
              <div className="p-2 rounded bg-navy-950/80 border border-navy-800 text-xs font-mono text-slate-300">
                {dns.aRecords?.length ? dns.aRecords.join(', ') : 'None'}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-slate-400 flex items-center justify-between mb-1">
                <span>AAAA Records (IPv6):</span>
                <span className={dns.aaaaRecords?.length ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                  {dns.aaaaRecords?.length || 0} published
                </span>
              </span>
              <div
                className={`p-2 rounded border text-xs font-mono ${
                  dns.aaaaRecords?.length
                    ? 'bg-navy-950/80 border-navy-800 text-slate-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {dns.aaaaRecords?.length ? dns.aaaaRecords.join(', ') : 'No AAAA record published for this domain'}
              </div>
            </div>
          </div>
        </div>

        {/* Browser Observation Metadata */}
        <div className="p-4 rounded-xl bg-navy-800/60 border border-navy-750 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-violet-400" /> Browser Observation Metadata
          </h4>
          <div className="text-xs font-mono space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Initiator Type:</span>
              <span className="text-slate-200">
                {data.initiator?.type || 'Direct HTML Request'}
              </span>
            </div>
            {data.parentUrl && (
              <div className="flex justify-between">
                <span className="text-slate-400">Parent URL:</span>
                <span className="text-slate-200 truncate max-w-[240px]" title={data.parentUrl}>
                  {data.parentUrl}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Browser Status:</span>
              <span className="text-slate-200">{data.browserStatusCode || 'Loaded'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
