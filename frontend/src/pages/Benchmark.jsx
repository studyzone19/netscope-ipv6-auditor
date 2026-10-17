import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Globe,
  ExternalLink,
  Filter,
  BarChart2,
  Loader2,
  StopCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { getBenchmark, runBenchmark, cancelBenchmark } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';

const CATEGORIES = [
  'All',
  'Search & Cloud',
  'Tech & Developer',
  'Media & News',
  'E-commerce & Retail',
  'Government & Education',
];

export function Benchmark() {
  const [benchmark, setBenchmark] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isRunning, setIsRunning] = useState(false);
  const [concurrency, setConcurrency] = useState(2);
  const navigate = useNavigate();

  const loadBenchmark = () => {
    getBenchmark().then((res) => {
      setBenchmark(res.benchmark);
      setIsRunning(res.benchmark?.status === 'running');
    });
  };

  useEffect(() => {
    loadBenchmark();
  }, []);

  // Poll status while running
  useEffect(() => {
    let timer = null;
    if (isRunning) {
      timer = setInterval(() => {
        getBenchmark().then((res) => {
          setBenchmark(res.benchmark);
          if (res.benchmark?.status !== 'running') {
            setIsRunning(false);
          }
        });
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning]);

  const handleStartBenchmark = async () => {
    try {
      setIsRunning(true);
      await runBenchmark({ concurrency, maxSites: 30 });
      loadBenchmark();
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  const handleCancelBenchmark = async () => {
    try {
      await cancelBenchmark();
      loadBenchmark();
    } catch (err) {
      console.error(err);
    }
  };

  const sites = benchmark?.sites || [];
  const filteredSites = sites.filter((s) => {
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  const chartData = sites
    .filter((s) => s.status === 'completed')
    .map((s) => ({
      name: s.name,
      rate: s.ipv6SuccessRate || 0,
      resources: s.totalResources || 0,
    }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-mono mb-2">
            <Award className="w-3.5 h-3.5 text-violet-400" />
            Empirical Ecosystem Study
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            30-Site Industry Benchmark
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            A standardized, controlled audit across 30 premier domains spanning Search & Cloud, Tech, Media, Retail, and Government to measure actual dependency IPv6 readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={handleCancelBenchmark}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" /> Stop Benchmark
            </button>
          ) : (
            <button
              onClick={handleStartBenchmark}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-102"
            >
              <Play className="w-4 h-4 fill-navy-950" /> Run 30-Site Benchmark
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sites"
          value={benchmark?.totalSites || 30}
          icon={Globe}
          accent="cyan"
          tooltip="Selected benchmark cohort"
        />
        <MetricCard
          title="Completed"
          value={benchmark?.completedSites || 0}
          denominator={`/ ${benchmark?.totalSites || 30}`}
          icon={CheckCircle}
          accent="emerald"
          tooltip="Sites actively audited and stored"
        />
        <MetricCard
          title="Avg IPv6 Readiness"
          value={`${benchmark?.overallIpv6Reachability || 0}%`}
          icon={Award}
          accent="teal"
          tooltip="Average percentage of dependencies reachable via IPv6"
        />
        <MetricCard
          title="Avg Dependencies"
          value={benchmark?.averageResourceCount || 0}
          icon={Layers}
          accent="violet"
          tooltip="Mean resources observed per tested site"
        />
      </div>

      {/* Progress Bar when running */}
      {isRunning && (
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              Executing batch audits across benchmark sites...
            </span>
            <span className="text-cyan-400 font-bold">
              {benchmark?.completedSites || 0} / {benchmark?.totalSites || 30} Completed
            </span>
          </div>
          <div className="w-full bg-navy-950 rounded-full h-2 overflow-hidden border border-navy-800">
            <div
              className="bg-cyan-400 h-full transition-all duration-500"
              style={{
                width: `${Math.round(
                  ((benchmark?.completedSites || 0) / (benchmark?.totalSites || 30)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Comparative Bar Chart (for completed sites) */}
      {chartData.length > 0 && (
        <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            IPv6 Readiness Scores Across Completed Benchmark Sites
          </h3>
          <p className="text-xs text-slate-400">
            Percentage of observed resources with verified end-to-end IPv6 connectivity.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={10} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="rate" name="IPv6 Reachability (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sector Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-navy-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-navy-900 hover:bg-navy-800 text-slate-400 border border-navy-750'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sites Benchmark Table */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-navy-950/80 text-slate-400 border-b border-navy-750">
              <tr>
                <th className="py-3.5 px-4">Domain & Sector</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Root AAAA Record</th>
                <th className="py-3.5 px-4">Observed Resources</th>
                <th className="py-3.5 px-4">IPv6 Reachability</th>
                <th className="py-3.5 px-4">Broken IPv6 Deps</th>
                <th className="py-3.5 px-4 text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-750 text-slate-200">
              {filteredSites.map((s, idx) => (
                <tr key={s.url || idx} className="hover:bg-navy-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{s.category}</span>
                      <span>•</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-0.5"
                      >
                        {s.url.replace('https://', '')}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    {s.status === 'completed' ? (
                      s.rootHasAaaa ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Missing AAAA
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500">Pending</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {s.status === 'completed' ? `${s.totalResources} dependencies` : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {s.status === 'completed' ? (
                      <div>
                        <span className="text-emerald-400 font-bold text-sm">
                          {s.ipv6SuccessRate}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          ({s.ipv6ReachableCount}/{s.totalResources})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Pending</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {s.status === 'completed' ? (
                      s.brokenDependenciesCount > 0 ? (
                        <span className="text-rose-400 font-bold">
                          {s.brokenDependenciesCount} failed
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold">0 broken</span>
                      )
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {s.auditId ? (
                      <button
                        onClick={() => navigate(`/explorer?auditId=${s.auditId}`)}
                        className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-cyan-300 border border-navy-700 text-[11px]"
                      >
                        Explore Graph
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[11px]">Not Audited</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
