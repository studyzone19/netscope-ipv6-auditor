import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Globe,
  FileCode,
  FileText,
  Image as ImageIcon,
  Type,
  Activity,
  Layers,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Radio,
  Cpu,
} from 'lucide-react';

const TYPE_ICONS = {
  document: Globe,
  script: FileCode,
  stylesheet: FileText,
  image: ImageIcon,
  font: Type,
  xhr: Activity,
  fetch: Activity,
  subframe: Layers,
  other: ExternalLink,
};

export const RootNode = memo(({ data }) => {
  const isFailure = data.isIpv6SpecificFailure;
  const isPassed = data.overallStatus === 'Passed';

  return (
    <div className="relative group cursor-pointer">
      {/* Outer Neon Pulsing Aura for Center Root Node */}
      <div
        className={`absolute -inset-2 rounded-2xl opacity-40 blur-lg transition-all group-hover:opacity-80 animate-pulse ${
          isFailure
            ? 'bg-rose-500'
            : isPassed
            ? 'bg-emerald-500'
            : 'bg-cyan-500'
        }`}
      />

      <div
        className={`relative px-5 py-4 rounded-xl border-2 transition-all shadow-2xl backdrop-blur-xl min-w-[260px] ${
          isFailure
            ? 'bg-navy-950/90 border-rose-500 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
            : isPassed
            ? 'bg-navy-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
            : 'bg-navy-950/90 border-cyan-400 text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
        }`}
      >
        {/* Handles in all 4 directions for radial/orbital routing */}
        <Handle type="source" position={Position.Top} id="top" className="!w-2 !h-2 !bg-cyan-400 !border-navy-950 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-cyan-400 !border-navy-950" />
        <Handle type="source" position={Position.Left} id="left" className="!w-2 !h-2 !bg-cyan-400 !border-navy-950 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-cyan-400 !border-navy-950 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Radio className="w-5 h-5 text-cyan-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-cyan-400 flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" /> APEX TARGET
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${
                  isPassed
                    ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/15'
                    : 'border-rose-500/40 text-rose-300 bg-rose-500/15'
                }`}
              >
                IPv6: {data.ipv6Outcome || (isPassed ? 'PASS' : 'FAIL')}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate font-mono tracking-tight">
              {data.hostname}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
              <span className="text-cyan-400">IPv4: {data.ipv4Outcome}</span>
              <span>•</span>
              <span className={isPassed ? 'text-emerald-400' : 'text-rose-400'}>
                IPv6: {data.ipv6Outcome}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const ResourceNode = memo(({ data }) => {
  const Icon = TYPE_ICONS[data.resourceType] || ExternalLink;
  const isFailure = data.isIpv6SpecificFailure;
  const isPassed = data.overallStatus === 'Passed';

  let borderStyle = 'border-navy-750 bg-navy-950/85 hover:border-cyan-500/60 text-slate-200';
  let glowStyle = 'hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]';
  let badgeStyle = 'border-slate-700 bg-slate-800 text-slate-300';

  if (isFailure) {
    borderStyle = 'border-rose-500/80 bg-navy-950/90 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
    glowStyle = 'hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]';
    badgeStyle = 'border-rose-500/40 bg-rose-500/15 text-rose-300 font-bold';
  } else if (isPassed) {
    borderStyle = 'border-emerald-500/60 bg-navy-950/90 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    glowStyle = 'hover:shadow-[0_0_18px_rgba(16,185,129,0.4)]';
    badgeStyle = 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-medium';
  }

  // Latency calculation if available
  const v4Latency = data.measurement?.ipv4?.tcpDurationMs;
  const v6Latency = data.measurement?.ipv6?.tcpDurationMs;

  return (
    <div
      className={`relative group px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all min-w-[210px] max-w-[250px] cursor-pointer hover:scale-105 hover:z-30 ${borderStyle} ${glowStyle}`}
    >
      {/* 4-way handles for smooth radial curves */}
      <Handle type="target" position={Position.Top} id="top" className="!w-1.5 !h-1.5 !bg-slate-500 !border-navy-950" />
      <Handle type="target" position={Position.Left} id="left" className="!w-1.5 !h-1.5 !bg-slate-500 !border-navy-950 opacity-0 group-hover:opacity-100" />
      <Handle type="target" position={Position.Right} id="right" className="!w-1.5 !h-1.5 !bg-slate-500 !border-navy-950 opacity-0 group-hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1.5 !h-1.5 !bg-slate-500 !border-navy-950" />

      <div className="flex items-center gap-2.5">
        <div
          className={`p-1.5 rounded-lg border shrink-0 ${
            isFailure
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              : isPassed
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-navy-800 border-navy-700 text-cyan-400'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[8.5px] uppercase font-mono font-bold tracking-wider text-slate-400 truncate">
              {data.resourceType}
              {data.isThirdParty && <span className="ml-1 text-[8px] text-violet-400 font-normal">[3P]</span>}
            </span>
            <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded border ${badgeStyle} shrink-0`}>
              {isFailure ? (
                <span className="flex items-center gap-0.5">
                  <AlertTriangle className="w-2 h-2" /> FAIL
                </span>
              ) : isPassed ? (
                <span className="flex items-center gap-0.5">
                  <CheckCircle className="w-2 h-2" /> PASS
                </span>
              ) : (
                data.overallStatus || 'PENDING'
              )}
            </span>
          </div>

          <p className="text-xs font-semibold text-white truncate font-mono tracking-tight">
            {data.label}
          </p>

          <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono mt-0.5">
            <span className="truncate max-w-[110px]" title={data.hostname}>
              {data.hostname}
            </span>
            {v6Latency !== undefined && (
              <span className={`text-[9px] ${isPassed ? 'text-emerald-400' : 'text-slate-500'}`}>
                {v6Latency}ms
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
