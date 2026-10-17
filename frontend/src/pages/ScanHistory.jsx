import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Globe,
  ExternalLink,
  Layers,
  ArrowRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { listAudits, getReportJsonUrl, getReportCsvUrl } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export function ScanHistory() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    listAudits(1, 50, statusFilter)
      .then((data) => {
        setAudits(data.audits || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const filteredAudits = audits.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.targetHost.toLowerCase().includes(q) || a.url.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Scan History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and inspect all stored browser-observed audits and transport measurements.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700 text-xs font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-navy-900 border border-navy-750 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by hostname or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-navy-950 border border-navy-750 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-navy-950 border border-navy-750 text-slate-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">In Progress</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Audits Table */}
      <div className="rounded-xl bg-navy-900 border border-navy-750 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400">
            Loading audit records...
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Globe className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-mono">No audits match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-950/80 text-slate-400 border-b border-navy-750">
                <tr>
                  <th className="py-3 px-4">Target Website</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Discovered</th>
                  <th className="py-3 px-4">IPv6 Reachable</th>
                  <th className="py-3 px-4">IPv6 Failures</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-750 text-slate-200">
                {filteredAudits.map((a) => {
                  const s = a.summary || {};
                  return (
                    <tr key={a._id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white truncate max-w-[220px]">
                          {a.targetHost}
                        </div>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[220px]">
                          {a.url}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={a.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        {s.totalDiscovered || 0} res
                        <span className="text-slate-500 text-[10px] block">
                          ({s.totalTested || 0} measured)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold">
                          {s.ipv6ReachabilityRate !== undefined ? `${s.ipv6ReachabilityRate}%` : 'N/A'}
                        </span>
                        <span className="text-slate-500 text-[10px] block">
                          {s.ipv6ReachableCount || 0} passed
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
                        {new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/explorer?auditId=${a._id}`)}
                          className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-cyan-300 border border-navy-700 text-[11px]"
                          title="Interactive Dependency Graph"
                        >
                          Graph
                        </button>
                        <button
                          onClick={() => navigate(`/parity?auditId=${a._id}`)}
                          className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 text-[11px]"
                          title="IPv4 vs IPv6 Parity"
                        >
                          Parity
                        </button>
                        <a
                          href={getReportJsonUrl(a._id)}
                          download
                          className="inline-block px-2 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white border border-navy-700 text-[11px]"
                          title="Download JSON Report"
                        >
                          JSON
                        </a>
                        <a
                          href={getReportCsvUrl(a._id)}
                          download
                          className="inline-block px-2 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white border border-navy-700 text-[11px]"
                          title="Download CSV Report"
                        >
                          CSV
                        </a>
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
