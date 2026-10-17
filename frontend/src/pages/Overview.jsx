import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Layers,
  CheckCircle,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  BarChart3,
  ExternalLink,
  HelpCircle,
  FileCode,
  FileText,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  Play,
  Share2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { listAudits, fetchHealth } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { WebsiteScanForm } from '../components/WebsiteScanForm';

// Beginner-friendly Networking Glossary Definitions
const GLOSSARY_ITEMS = [
  { term: 'IPv4', label: 'Legacy Internet Protocol', desc: 'The 32-bit address standard (e.g. 142.250.190.46) in use since 1983. Address space is exhausted.' },
  { term: 'IPv6', label: 'Next-Gen Internet Protocol', desc: 'The 128-bit address standard (e.g. 2404:6800:4002::200e) providing trillions of unique IP addresses for all modern devices.' },
  { term: 'DNS (A vs AAAA)', label: 'Domain Name System', desc: 'Translates domain names to IP addresses. "A" records point to IPv4 addresses; "AAAA" records point to IPv6 addresses.' },
  { term: 'TCP Handshake', label: 'Transmission Control Protocol', desc: 'The 3-way SYN-ACK handshake establishing a reliable raw byte connection before data flows.' },
  { term: 'TLS Handshake', label: 'Transport Layer Security', desc: 'Negotiates encryption (HTTPS), digital certificates, and cipher suites so traffic cannot be eavesdropped.' },
  { term: 'HTTP Status', label: 'Hypertext Transfer Protocol', desc: 'The application request/response codes (e.g., 200 OK, 404 Not Found, 500 Server Error).' },
  { term: 'Dependency Graph', label: 'Resource Map', desc: 'Visual network map showing how the main HTML website connects to all child scripts, styles, images, and APIs.' },
];

export function Overview() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerHealth, setWorkerHealth] = useState(null);
  const [activeGlossaryTab, setActiveGlossaryTab] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.allSettled([listAudits(1, 10), fetchHealth()]).then(
      ([auditsRes, healthRes]) => {
        if (auditsRes.status === 'fulfilled') {
          setAudits(auditsRes.value.audits || []);
        }
        if (healthRes.status === 'fulfilled') {
          setWorkerHealth(healthRes.value);
        }
        setLoading(false);
      }
    );
  }, []);

  // Compute aggregate metrics from real stored audits
  const totalAudits = audits.length;
  let totalDiscovered = 0;
  let totalTested = 0;
  let totalIpv6Reachable = 0;
  let totalIpv6SpecificFailures = 0;

  const typeCounts = {};
  const failureCounts = {};

  audits.forEach((a) => {
    const s = a.summary || {};
    totalDiscovered += s.totalDiscovered || 0;
    totalTested += s.totalTested || 0;
    totalIpv6Reachable += s.ipv6ReachableCount || 0;
    totalIpv6SpecificFailures += s.confirmedIpv6SpecificFailures || 0;

    if (s.resourceTypeBreakdown) {
      Object.entries(s.resourceTypeBreakdown).forEach(([k, v]) => {
        typeCounts[k] = (typeCounts[k] || 0) + v;
      });
    }
    if (s.failureCategories) {
      Object.entries(s.failureCategories).forEach(([k, v]) => {
        failureCounts[k] = (failureCounts[k] || 0) + v;
      });
    }
  });

  const ipv6ReachabilityRate =
    totalTested > 0 ? Math.round((totalIpv6Reachable / totalTested) * 100) : 0;
  const coverageRate =
    totalDiscovered > 0 ? Math.round((totalTested / totalDiscovered) * 100) : (totalAudits > 0 ? 100 : 0);

  // Fallback demo values strictly labeled as DEMO DATA if no audits have run yet
  const hasRealData = totalAudits > 0;

  const reachabilityPieData = hasRealData
    ? [
        { name: 'IPv6 Reachable', value: totalIpv6Reachable, color: '#10B981' },
        {
          name: 'IPv6 Failure / Missing AAAA',
          value: totalTested - totalIpv6Reachable > 0 ? totalTested - totalIpv6Reachable : 0,
          color: '#EF4444',
        },
      ]
    : [
        { name: 'IPv6 Reachable (Demo)', value: 18, color: '#10B981' },
        { name: 'IPv6 Failure (Demo)', value: 6, color: '#EF4444' },
      ];

  const resourceTypeBarData = hasRealData
    ? Object.entries(typeCounts).map(([type, count]) => ({
        type: type.toUpperCase(),
        count,
      }))
    : [
        { type: 'SCRIPT', count: 12 },
        { type: 'STYLESHEET', count: 4 },
        { type: 'IMAGE', count: 8 },
        { type: 'FONT', count: 3 },
        { type: 'FETCH/API', count: 5 },
      ];

  const failureBarData = hasRealData
    ? Object.entries(failureCounts).map(([cat, count]) => ({
        category: cat,
        count,
      }))
    : [
        { category: 'Passed', count: 18 },
        { category: 'DNS failure', count: 4 },
        { category: 'TCP failure', count: 2 },
      ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* 1. Hero & Prominent Beginner Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-navy-750 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Hackathon & Jury Ready Network Observability
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Beyond DNS. Measure Every Dependency. Prove IPv6 Readiness.
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            A website is <strong className="text-white">not</strong> IPv6-ready just because its domain has an AAAA record.
            Its scripts, CSS, fonts, and APIs may fail silently over IPv6 while standard browsers hide the failure using IPv4 fallback.
            NetScope opens a real headless browser, discovers all dependencies, and tests IPv4 and IPv6 independently.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/new-audit')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-navy-950 font-bold text-sm transition-all shadow-xl shadow-cyan-500/25 hover:scale-102 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-navy-950" /> Start Your First Audit
            </button>
            <button
              onClick={() => navigate('/explorer')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-cyan-300 border border-navy-700 font-semibold text-xs transition-all"
            >
              <Share2 className="w-4 h-4" /> Open Dependency Explorer
            </button>
            <button
              onClick={() => navigate('/lab')}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-navy-800/80 hover:bg-navy-750 text-slate-300 border border-navy-700 font-semibold text-xs transition-all"
            >
              Controlled Lab (Test Suite)
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Website Scan & Typo Fix Guide Form */}
      <WebsiteScanForm />

      {/* 2. Simple "How to use NetScope" Section (Requirement 1) */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 md:p-8 shadow-xl space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            Beginner's Quick Guide
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            How to Use NetScope in 5 Simple Steps
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Follow this clear workflow to audit any website and prove genuine dual-stack compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: 'Step 1',
              title: 'Enter a Website',
              desc: 'Provide any public URL or test target. Pre-flight security automatically checks against SSRF.',
              icon: Globe,
              accent: 'cyan',
            },
            {
              step: 'Step 2',
              title: 'Discover Resources',
              desc: 'A headless Chromium browser navigates the page to intercept runtime JavaScript, CSS, images, and APIs.',
              icon: Layers,
              accent: 'teal',
            },
            {
              step: 'Step 3',
              title: 'Test IPv4 & IPv6',
              desc: 'NetScope creates separate family-isolated OS sockets to test DNS, TCP, and TLS without silent fallback.',
              icon: Activity,
              accent: 'violet',
            },
            {
              step: 'Step 4',
              title: 'Inspect Failures',
              desc: 'Explore the interactive React Flow graph to see exactly which sub-resource broke and why.',
              icon: AlertTriangle,
              accent: 'rose',
            },
            {
              step: 'Step 5',
              title: 'Export Report',
              desc: 'Download audit-grade JSON and CSV datasets matching stored database records for DevOps teams.',
              icon: CheckCircle2,
              accent: 'emerald',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-4 rounded-xl bg-navy-950/60 border border-navy-800 flex flex-col justify-between space-y-3 relative hover:border-navy-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-cyan-400">
                      {item.step}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Metrics Row with Short Plain-English Explanations (Requirement 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Live Measurement Metrics</h2>
            <p className="text-xs text-slate-400">
              Aggregated from stored database records. Denominators exclude unmeasured resources.
            </p>
          </div>
          {!hasRealData && (
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
              SHOWING DEMO DATA (Run an audit to see live results)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Websites Audited"
            value={hasRealData ? totalAudits : 1}
            explanation="Number of distinct websites checked."
            icon={Globe}
            accent="cyan"
            isDemo={!hasRealData}
          />
          <MetricCard
            title="Resources Discovered"
            value={hasRealData ? totalDiscovered : 24}
            explanation="Number of resources observed in browser sessions."
            icon={Layers}
            accent="teal"
            isDemo={!hasRealData}
          />
          <MetricCard
            title="Resources Tested"
            value={hasRealData ? totalTested : 24}
            denominator={hasRealData ? `/ ${totalDiscovered}` : '/ 24'}
            explanation="Number of resources with completed measurements."
            icon={Activity}
            accent="violet"
            isDemo={!hasRealData}
          />
          <MetricCard
            title="IPv6 Reachability"
            value={hasRealData ? `${ipv6ReachabilityRate}%` : '75%'}
            denominator={hasRealData ? `(${totalIpv6Reachable}/${totalTested})` : '(18/24)'}
            explanation="Percentage of eligible, actually tested resources reachable over IPv6."
            icon={CheckCircle}
            accent="emerald"
            isDemo={!hasRealData}
          />
          <MetricCard
            title="Confirmed IPv6 Failures"
            value={hasRealData ? totalIpv6SpecificFailures : 6}
            explanation="Failures supported by evidence from valid IPv6 tests."
            icon={AlertTriangle}
            accent="rose"
            isDemo={!hasRealData}
          />
          <MetricCard
            title="Measurement Coverage"
            value={hasRealData ? `${coverageRate}%` : '100%'}
            explanation="Percentage of discovered resources that received the required measurements."
            icon={Cpu}
            accent="cyan"
            isDemo={!hasRealData}
          />
        </div>
      </div>

      {/* 4. Flagship Demonstration Feature Callout: Dependency Explorer (Requirement 6) */}
      <div className="rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-cyan-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              Main Demonstration Feature
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Interactive Dependency Explorer
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Modern websites depend on a complex web of third-party assets. NetScope renders an interactive, zoomable dependency graph showing how your root website connects to its <strong className="text-cyan-300">JavaScript files, CSS stylesheets, images, fonts, and API calls</strong>.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Green: Dual-Stack Passed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Red: IPv6-Specific Failure
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Amber: DNS / Missing AAAA
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => navigate('/explorer')}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-102 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Explore Interactive Graph
            </button>
            <button
              onClick={() => navigate('/parity')}
              className="px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 border border-navy-700 font-semibold text-xs flex items-center justify-center gap-2"
            >
              Compare IPv4 vs IPv6
            </button>
          </div>
        </div>
      </div>

      {/* 5. "What do these results mean?" with Simple Examples (Requirement 5) */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 md:p-8 shadow-xl space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
            Plain-English Reference
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            What Do These Results Mean?
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Here is how to interpret audit verdicts with real-world scenarios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dual-Stack Ready (Passed)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Example:</strong> Both IPv4 and IPv6 have valid DNS records, and TCP sockets, TLS handshakes, and HTTP requests all connect quickly.
            </p>
            <span className="text-[10px] text-emerald-300 font-mono block">
              Verdict: Safe for IPv6-only cellular users.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <XCircle className="w-4 h-4" />
              <span>TCP Handshake Failure</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Example:</strong> Domain has an AAAA record, but the server firewall blocks port 443 over IPv6 (SYN packets dropped or connection refused).
            </p>
            <span className="text-[10px] text-rose-300 font-mono block">
              Verdict: AAAA alone does NOT mean working!
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Missing AAAA Record</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Example:</strong> Domain has an IPv4 A record, but authoritative DNS has no AAAA record. IPv6 clients cannot resolve it.
            </p>
            <span className="text-[10px] text-amber-300 font-mono block">
              Verdict: DNS configuration gap.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Info className="w-4 h-4" />
              <span>HTTP 404 Disassociation</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Example:</strong> An image returns 404 Not Found. This is an application missing-file error, NOT an IPv6 transport drop. Transport succeeded.
            </p>
            <span className="text-[10px] text-cyan-300 font-mono block">
              Verdict: Transport passed; file missing.
            </span>
          </div>
        </div>
      </div>

      {/* 6. Networking Concept Explainer Pills / Tooltips (Requirement 3) */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Interactive Networking Concept Explainer
            </h3>
            <p className="text-xs text-slate-400">
              Click any networking term below to view its simple, plain-English definition.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {GLOSSARY_ITEMS.map((item) => (
            <button
              key={item.term}
              onClick={() =>
                setActiveGlossaryTab(activeGlossaryTab === item.term ? null : item.term)
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeGlossaryTab === item.term
                  ? 'bg-cyan-500 text-navy-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-navy-950 hover:bg-navy-800 text-slate-300 border border-navy-750'
              }`}
            >
              <span>{item.term}</span>
              <HelpCircle className="w-3 h-3 text-cyan-400" />
            </button>
          ))}
        </div>

        {activeGlossaryTab && (
          <div className="p-4 rounded-xl bg-navy-950 border border-cyan-500/30 text-xs font-sans text-slate-200 animate-in fade-in duration-200">
            {(() => {
              const selected = GLOSSARY_ITEMS.find((g) => g.term === activeGlossaryTab);
              return (
                <div className="space-y-1">
                  <div className="font-bold text-cyan-400 font-mono flex items-center gap-2">
                    <span>{selected?.term}</span>
                    <span className="text-slate-400 font-normal">({selected?.label})</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{selected?.desc}</p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 7. Easy-to-Read Charts Section with Proper Units and Labels (Requirement 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reachability Ratio */}
        <div className="rounded-xl bg-navy-900 border border-navy-750 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                IPv6 Reachability Ratio
              </h3>
              {!hasRealData && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Percentage of measured dependencies reachable via IPv6.
            </p>
          </div>
          <div className="h-52 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reachabilityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reachabilityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} resources`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] text-slate-500 font-mono text-center block">
            {hasRealData ? 'Computed from actual completed audits' : 'Preview chart showing expected distribution'}
          </span>
        </div>

        {/* Resource Breakdown */}
        <div className="rounded-xl bg-navy-900 border border-navy-750 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Discovered Resource Types
              </h3>
              {!hasRealData && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Count of resources grouped by category (scripts, styles, APIs).
            </p>
          </div>
          <div className="h-52 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceTypeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="type" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip
                  formatter={(val) => [`${val} resources`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Resources" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] text-slate-500 font-mono text-center block">
            Unit: Total observed network resources
          </span>
        </div>

        {/* Failure Taxonomy */}
        <div className="rounded-xl bg-navy-900 border border-navy-750 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Failure Taxonomy Breakdown
              </h3>
              {!hasRealData && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Count of outcomes across scientific classification rules.
            </p>
          </div>
          <div className="h-52 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip
                  formatter={(val) => [`${val} items`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] text-slate-500 font-mono text-center block">
            Unit: Distinct classification outcomes
          </span>
        </div>
      </div>

      {/* 8. Recent Audits Table with Empty State (Requirement 11) */}
      <div className="rounded-xl bg-navy-900 border border-navy-750 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-navy-750 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Audits</h3>
            <p className="text-xs text-slate-400">
              Live database records with actual observed metrics.
            </p>
          </div>
          {hasRealData && (
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View All Scans <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!hasRealData ? (
          <div className="p-10 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">No Audits Run Yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Your database is empty and waiting. Start your first website audit to discover all its sub-resources and view the interactive dependency graph!
              </p>
            </div>
            <button
              onClick={() => navigate('/new-audit')}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Start First Audit Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-950/60 text-slate-400 border-b border-navy-750">
                <tr>
                  <th className="py-3 px-4">Target Website</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Resources</th>
                  <th className="py-3 px-4">IPv6 Reachable</th>
                  <th className="py-3 px-4">IPv6 Failures</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-750 text-slate-200">
                {audits.map((audit) => {
                  const s = audit.summary || {};
                  return (
                    <tr key={audit._id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="truncate max-w-[200px]">{audit.targetHost}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={audit.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        {s.totalDiscovered || 0} discovered
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold">
                          {s.ipv6ReachabilityRate !== undefined ? `${s.ipv6ReachabilityRate}%` : 'N/A'}
                        </span>
                        <span className="text-slate-500 text-[10px] ml-1">
                          ({s.ipv6ReachableCount || 0}/{s.totalTested || 0})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {s.confirmedIpv6SpecificFailures > 0 ? (
                          <span className="text-rose-400 font-bold">
                            {s.confirmedIpv6SpecificFailures}
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(audit.createdAt).toLocaleDateString()} {new Date(audit.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/explorer?auditId=${audit._id}`)}
                          className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-cyan-300 border border-navy-700 text-[11px]"
                        >
                          Explore Graph
                        </button>
                        <button
                          onClick={() => navigate(`/reports?auditId=${audit._id}`)}
                          className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 text-[11px]"
                        >
                          Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
