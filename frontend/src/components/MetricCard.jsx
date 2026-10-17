import React from 'react';
import { HelpCircle } from 'lucide-react';

export function MetricCard({
  title,
  value,
  denominator,
  explanation,
  icon: Icon,
  accent = 'cyan',
  tooltip,
  isDemo = false,
}) {
  const accentClasses = {
    cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/10',
    teal: 'border-teal-500/20 text-teal-400 bg-teal-500/10',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/10',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
    violet: 'border-violet-500/20 text-violet-400 bg-violet-500/10',
  };

  const currentAccent = accentClasses[accent] || accentClasses.cyan;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-navy-900 border border-navy-750 p-5 shadow-lg transition-all hover:border-navy-600 hover:shadow-cyan-950/20 flex flex-col justify-between"
      title={tooltip || explanation}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {isDemo && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider">
                DEMO DATA
              </span>
            )}
          </div>
          {Icon && (
            <div className={`p-2 rounded-lg border ${currentAccent} shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            {value}
          </span>
          {denominator && (
            <span className="text-xs text-slate-400 font-mono">
              {denominator}
            </span>
          )}
        </div>
      </div>

      {explanation && (
        <div className="mt-3 pt-2.5 border-t border-navy-800/80">
          <p className="text-[11px] text-slate-300/90 leading-relaxed font-sans flex items-start gap-1.5">
            <span className="text-cyan-400 font-bold shrink-0">•</span>
            <span>{explanation}</span>
          </p>
        </div>
      )}
    </div>
  );
}
