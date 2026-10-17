import React from 'react';

export function StatusBadge({ status, isIpv6SpecificFailure, size = 'md' }) {
  let bg = 'bg-slate-800/80';
  let text = 'text-slate-300';
  let border = 'border-slate-700';
  let label = status || 'Untested';

  if (isIpv6SpecificFailure) {
    bg = 'bg-rose-500/15';
    text = 'text-rose-400';
    border = 'border-rose-500/30';
    label = `${status} (IPv6-Specific)`;
  } else {
    switch (status) {
      case 'Passed':
      case 'completed':
      case 'PASSED':
        bg = 'bg-emerald-500/15';
        text = 'text-emerald-400';
        border = 'border-emerald-500/30';
        break;
      case 'DNS failure':
        bg = 'bg-amber-500/15';
        text = 'text-amber-400';
        border = 'border-amber-500/30';
        break;
      case 'TCP failure':
      case 'failed':
      case 'FAILED':
        bg = 'bg-rose-500/15';
        text = 'text-rose-400';
        border = 'border-rose-500/30';
        break;
      case 'TLS failure':
        bg = 'bg-violet-500/15';
        text = 'text-violet-400';
        border = 'border-violet-500/30';
        break;
      case 'HTTP error':
        bg = 'bg-orange-500/15';
        text = 'text-orange-400';
        border = 'border-orange-500/30';
        break;
      case 'Timeout':
        bg = 'bg-yellow-500/15';
        text = 'text-yellow-400';
        border = 'border-yellow-500/30';
        break;
      case 'running':
      case 'validating':
      case 'discovering':
      case 'measuring_ipv4':
      case 'measuring_ipv6':
      case 'classifying':
        bg = 'bg-cyan-500/15';
        text = 'text-cyan-400';
        border = 'border-cyan-500/30';
        break;
      case 'Unsupported':
        bg = 'bg-slate-700/50';
        text = 'text-slate-400';
        border = 'border-slate-600/50';
        break;
      case 'pending':
      case 'idle':
        bg = 'bg-slate-800';
        text = 'text-slate-400';
        border = 'border-slate-700';
        break;
      default:
        bg = 'bg-slate-800';
        text = 'text-slate-300';
        border = 'border-slate-700';
    }
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${padding} ${bg} ${text} ${border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${text.replace('text-', 'bg-')}`} />
      {label}
    </span>
  );
}
