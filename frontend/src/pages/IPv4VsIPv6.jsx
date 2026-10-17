import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Globe,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { listAudits, getAuditResources, getAudit } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export function IPv4VsIPv6() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [audits, setAudits] = useState([]);
  const [selectedAuditId, setSelectedAuditId] = useState(searchParams.get('auditId') || '');
  const [audit, setAudit] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listAudits(1, 20).then((data) => {
      const list = data.audits || [];
      setAudits(list);
      if (!selectedAuditId && list.length > 0) {
        setSelectedAuditId(list[0]._id);
        setSearchParams({ auditId: list[0]._id });
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedAuditId) return;
    setLoading(true);

    Promise.allSettled([
      getAudit(selectedAuditId),
      getAuditResources(selectedAuditId),
    ]).then(([auditRes, resRes]) => {
      if (auditRes.status === 'fulfilled') setAudit(auditRes.value.audit);
      if (resRes.status === 'fulfilled') setResources(resRes.value.resources || []);
      setLoading(false);
    });
  }, [selectedAuditId]);

  const handleAuditSelect = (id) => {
    setSelectedAuditId(id);
    setSearchParams({ auditId: id });
  };

  // Compute protocol statistics
  let ipv4SuccessCount = 0;
  let ipv6SuccessCount = 0;
  let totalLatencyV4 = 0;
  let totalLatencyV6 = 0;
  let measuredCountV4 = 0;
  let measuredCountV6 = 0;

  const comparisonChartData = [];

  resources.forEach((r) => {
    const m = r.measurement;
    if (!m) return;

    if (m.ipv4?.tcpConnected) {
      ipv4SuccessCount++;
      totalLatencyV4 += m.ipv4.tcpDurationMs || 0;
      measuredCountV4++;
    }
    if (m.ipv6?.tcpConnected) {
      ipv6SuccessCount++;
      totalLatencyV6 += m.ipv6.tcpDurationMs || 0;
      measuredCountV6++;
    }

    if (m.ipv4?.tested && m.ipv6?.tested && comparisonChartData.length < 12) {
      comparisonChartData.push({
        name: r.pathname.split('/').pop() || r.hostname,
        ipv4Tcp: m.ipv4.tcpDurationMs || 0,
        ipv6Tcp: m.ipv6.tcpDurationMs || 0,
      });
    }
  });

  const avgLatencyV4 = measuredCountV4 > 0 ? Math.round(totalLatencyV4 / measuredCountV4) : 0;
  const avgLatencyV6 = measuredCountV6 > 0 ? Math.round(totalLatencyV6 / measuredCountV6) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            IPv4 vs IPv6 Protocol Parity Analyzer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare DNS resolution, TCP handshake latency, and TLS negotiations side-by-side across all dependencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <select
            value={selectedAuditId}
            onChange={(e) => handleAuditSelect(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-750 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
          >
            {audits.map((a) => (
              <option key={a._id} value={a._id}>
                {a.targetHost} ({new Date(a.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Protocol Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IPv4 Transport Card */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-750">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400" />
              <h3 className="text-base font-bold text-white font-mono">IPv4 Transport Protocol</h3>
            </div>
            <span className="text-xs font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              Legacy Stack
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
              <span className="text-[11px] font-mono text-slate-400 block">TCP Connections</span>
              <span className="text-xl font-bold font-mono text-white">
                {ipv4SuccessCount}
              </span>
              <span className="text-[10px] text-slate-500 block">/ {resources.length} resources</span>
            </div>
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
              <span className="text-[11px] font-mono text-slate-400 block">Average TCP Latency</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {avgLatencyV4}ms
              </span>
              <span className="text-[10px] text-slate-500 block">SYN/ACK round-trip</span>
            </div>
          </div>
        </div>

        {/* IPv6 Transport Card */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-750">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-400" />
              <h3 className="text-base font-bold text-white font-mono">IPv6 Transport Protocol</h3>
            </div>
            <span className="text-xs font-mono text-teal-300 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              Modern Next-Gen Stack
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
              <span className="text-[11px] font-mono text-slate-400 block">TCP Connections</span>
              <span className="text-xl font-bold font-mono text-white">
                {ipv6SuccessCount}
              </span>
              <span className="text-[10px] text-slate-500 block">/ {resources.length} resources</span>
            </div>
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
              <span className="text-[11px] font-mono text-slate-400 block">Average TCP Latency</span>
              <span className="text-xl font-bold font-mono text-teal-400">
                {avgLatencyV6}ms
              </span>
              <span className="text-[10px] text-slate-500 block">
                {avgLatencyV6 > 0 && avgLatencyV4 > 0
                  ? avgLatencyV6 <= avgLatencyV4
                    ? `${avgLatencyV4 - avgLatencyV6}ms faster than IPv4`
                    : `${avgLatencyV6 - avgLatencyV4}ms slower than IPv4`
                  : 'SYN/ACK round-trip'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Latency Comparison Chart */}
      {comparisonChartData.length > 0 && (
        <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            TCP Handshake Latency Comparison (IPv4 vs IPv6)
          </h3>
          <p className="text-xs text-slate-400">
            Measured in milliseconds for dual-stack resources during the audit.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={10} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar dataKey="ipv4Tcp" name="IPv4 TCP Latency (ms)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ipv6Tcp" name="IPv6 TCP Latency (ms)" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Side-by-Side Resources Table */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-navy-750 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Dependency Parity Matrix</h3>
            <p className="text-xs text-slate-400">
              Direct side-by-side evidence for every observed resource.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-navy-950/80 text-slate-400 border-b border-navy-750">
              <tr>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">DNS (A / AAAA)</th>
                <th className="py-3 px-4">IPv4 Transport</th>
                <th className="py-3 px-4">IPv6 Transport</th>
                <th className="py-3 px-4">Overall Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-750 text-slate-200">
              {resources.map((res) => {
                const m = res.measurement || {};
                const dns = m.dns || {};
                const v4 = m.ipv4 || {};
                const v6 = m.ipv6 || {};
                const c = m.classification || {};

                return (
                  <tr key={res._id} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white truncate max-w-[200px]" title={res.url}>
                        {res.pathname.split('/').pop() || res.hostname}
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block max-w-[200px]">
                        {res.hostname}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {res.resourceType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={dns.aRecords?.length ? 'text-cyan-400' : 'text-slate-500'}>
                          A:{dns.aRecords?.length || 0}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className={dns.aaaaRecords?.length ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                          AAAA:{dns.aaaaRecords?.length || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <StatusBadge status={v4.outcome || 'Untested'} size="sm" />
                        {v4.tcpConnected && (
                          <span className="text-[10px] text-slate-400 block">
                            {v4.tcpDurationMs}ms TCP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <StatusBadge
                          status={v6.outcome || 'Untested'}
                          isIpv6SpecificFailure={c.isIpv6SpecificFailure}
                          size="sm"
                        />
                        {v6.tcpConnected && (
                          <span className="text-[10px] text-slate-400 block">
                            {v6.tcpDurationMs}ms TCP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={c.overall || 'Untested'}
                        isIpv6SpecificFailure={c.isIpv6SpecificFailure}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
