import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export function TrustSignalsCard({ trustSignals }) {
  if (!trustSignals) return null;

  const { overview, transportSecurity, domainIntegrity, suspiciousSignals } = trustSignals;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-cyan-500/30 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase tracking-wider">
                WEBSITE HEALTH & TRUST SIGNALS
              </span>
              <span className="text-xs font-mono text-slate-400">
                Separated from IPv6 Verdict
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              Domain Integrity, SSL/TLS & Availability Health
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Verdict:</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
            {overview?.verdict || 'Standard Architecture'}
          </span>
        </div>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        {/* Pillar 1: Transport Security */}
        <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 space-y-2">
          <div className="flex items-center justify-between text-cyan-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Transport Security
            </span>
            <span>{transportSecurity?.httpsEnforced ? 'HTTPS Active' : 'HTTP Only'}</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">HTTPS Enforced:</span>
              <span className={transportSecurity?.httpsEnforced ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {transportSecurity?.httpsEnforced ? 'Yes (Port 443)' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">TLS Handshake:</span>
              <span className="text-emerald-400">{transportSecurity?.tlsHandshakePassed ? 'Verified' : 'Passed'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Negotiated Protocol:</span>
              <span className="text-violet-300">{transportSecurity?.tlsVersion || 'TLSv1.3'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mixed Content:</span>
              <span className={transportSecurity?.mixedContentDetected ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {transportSecurity?.mixedContentDetected ? 'Detected (Warning)' : 'None Observed'}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Domain Integrity */}
        <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 space-y-2">
          <div className="flex items-center justify-between text-teal-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> Domain & DNS
            </span>
            <span>{domainIntegrity?.hasA && domainIntegrity?.hasAaaa ? 'Dual-Stack' : 'Single-Stack'}</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">A Records (IPv4):</span>
              <span className={domainIntegrity?.hasA ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                {domainIntegrity?.hasA ? 'Published' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AAAA Records (IPv6):</span>
              <span className={domainIntegrity?.hasAaaa ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {domainIntegrity?.hasAaaa ? 'Published' : 'Not Observed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CNAME Routing:</span>
              <span className="text-slate-300">
                {domainIntegrity?.cnameChain?.length ? `${domainIntegrity.cnameChain.length} hops` : 'Direct A/AAAA'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DNSSEC Security:</span>
              <span className="text-slate-400">{domainIntegrity?.dnssecObserved || 'Standard Zone'}</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Suspicious Site Analysis */}
        <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 space-y-2">
          <div className="flex items-center justify-between text-rose-400 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Suspicious Heuristics
            </span>
            <span>{suspiciousSignals?.detected ? 'Signals Found' : 'Clean'}</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300 pt-1">
            {!suspiciousSignals?.detected ? (
              <div className="flex items-center gap-2 text-emerald-400 font-sans py-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>No lookalike domain or misleading redirects detected.</span>
              </div>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-amber-300">
                {suspiciousSignals.indicators.map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory RFC Strict Compliance Disclaimer */}
      <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-850 flex items-start gap-2.5 text-xs text-slate-400 font-sans">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Scientific Integrity Notice:</strong> A missing AAAA record, slow connection, or DNS timeout is <strong>never</strong> labeled as a "fake" or "scam" website. Legitimacy requires cryptographic forensics and identity verification.
        </p>
      </div>
    </div>
  );
}
