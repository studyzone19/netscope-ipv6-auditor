import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  GitFork,
  ArrowLeftRight,
  Award,
  FlaskConical,
  FileSpreadsheet,
  BookOpen,
  Menu,
  X,
  Radio,
  ExternalLink,
  ShieldCheck,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { fetchHealth } from '../api/client';

const NAV_ITEMS = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'New Audit', path: '/new-audit', icon: PlusCircle },
  { name: 'Scan History', path: '/history', icon: History },
  { name: 'Dependency Explorer', path: '/explorer', icon: GitFork },
  { name: 'IPv4 vs IPv6', path: '/parity', icon: ArrowLeftRight },
  { name: '30-Site Benchmark', path: '/benchmark', icon: Award },
  { name: 'Controlled Lab', path: '/lab', icon: FlaskConical },
  { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  { name: 'Methodology', path: '/methodology', icon: BookOpen },
];

export function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workerHealth, setWorkerHealth] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHealth()
      .then((data) => setWorkerHealth(data))
      .catch((err) => console.warn('Could not fetch worker health', err));
  }, []);

  const activeItem = NAV_ITEMS.find((item) =>
    item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)
  ) || { name: 'Dashboard' };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-navy-800 bg-navy-900/90 backdrop-blur-md shrink-0">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-navy-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 text-navy-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-white tracking-tight text-base font-mono">
                NetScope
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                IPv6
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Auditor Engine</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Worker Status Footer */}
        <div className="p-4 border-t border-navy-800 bg-navy-950/40">
          <div className="text-[11px] font-mono text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                Vantage Point:
                <span title="The server node executing the network socket measurements">
                  <HelpCircle className="w-3 h-3 text-slate-500 hover:text-cyan-400 cursor-pointer" />
                </span>
              </span>
              <span className="text-slate-300">
                {workerHealth?.worker?.hostname || 'Local Node'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Worker State:</span>
              {!workerHealth ? (
                <span className="text-slate-400">Probing...</span>
              ) : workerHealth.worker?.hasNativeIpv6 ? (
                <span
                  className="flex items-center gap-1 text-emerald-400 font-bold"
                  title="Worker has active IPv6 routes and passed socket handshake verification"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Dual-Stack Verified
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 text-amber-400"
                  title="Worker has IPv4 only. IPv6 measurements marked Unsupported to prevent false failures."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  IPv4-Only Worker
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-navy-800 bg-navy-900">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400" />
          <span className="font-bold font-mono text-white">NetScope IPv6</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-900 border-b border-navy-800 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-navy-800"
            >
              <item.icon className="w-4 h-4 text-cyan-400" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-navy-800 bg-navy-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-xs font-bold text-white tracking-widest uppercase font-mono">
                {activeItem.name}
              </h2>
            </div>
            <span className="hidden xl:inline-block text-[11px] font-mono text-slate-400">
              | Beyond DNS • Measure Every Dependency
            </span>
          </div>

          {/* Centered Futuristic Tab Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-navy-950/70 border border-navy-800 rounded-xl p-1 shadow-inner">
            {[
              { label: 'DASHBOARD', path: '/' },
              { label: 'DEPENDENCY GRAPH', path: '/explorer' },
              { label: 'IPv4 vs IPv6', path: '/parity' },
              { label: 'CONTROLLED LAB', path: '/lab' },
              { label: 'REPORTS', path: '/reports' },
            ].map((tab) => {
              const isTabActive =
                tab.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(tab.path);
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all ${
                    isTabActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/50'
                  }`}
                >
                  {tab.label}
                </NavLink>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Network Online Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>NETWORK: ONLINE</span>
            </div>

            {/* Worker status pill */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800/80 border border-navy-750 text-xs font-mono">
              <span className="text-slate-400">Vantage:</span>
              {!workerHealth ? (
                <span className="text-slate-400">Checking...</span>
              ) : workerHealth.worker?.hasNativeIpv6 ? (
                <span
                  className="text-emerald-400 flex items-center gap-1 font-medium"
                  title="Worker host has verified dual-stack IPv4 and IPv6 network stack"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Dual-Stack Active
                </span>
              ) : (
                <span
                  className="text-amber-400 flex items-center gap-1 font-medium"
                  title="Worker host lacks an active IPv6 default route. IPv6 tests will be marked Unsupported."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  IPv4-Only Active
                </span>
              )}
            </div>

            <button
              onClick={() => navigate('/new-audit')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-102"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Audit</span>
            </button>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
