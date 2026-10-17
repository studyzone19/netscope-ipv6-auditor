import React from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Award,
  Zap,
  Globe,
  ArrowRight,
} from 'lucide-react';

export function EasyNotesView({ easyNotes }) {
  if (!easyNotes) return null;

  const { quickVerdict, notes = [], howToExplainToJury = [] } = easyNotes;

  const isReady = quickVerdict?.status === 'IPv6 Ready';
  const hasFailures = quickVerdict?.status === 'Action Needed';

  return (
    <div className="space-y-4">
      {/* 1. Quick Verdict Highlight Banner */}
      <div
        className={`p-5 rounded-2xl border-2 transition-all shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isReady
            ? 'bg-gradient-to-r from-emerald-950/60 via-navy-900 to-navy-950 border-emerald-500/50 shadow-emerald-950/40'
            : hasFailures
            ? 'bg-gradient-to-r from-rose-950/60 via-navy-900 to-navy-950 border-rose-500/50 shadow-rose-950/40'
            : 'bg-gradient-to-r from-cyan-950/60 via-navy-900 to-navy-950 border-cyan-500/50 shadow-cyan-950/40'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl border shrink-0 ${
              isReady
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : hasFailures
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
            }`}
          >
            {isReady ? (
              <CheckCircle className="w-6 h-6 animate-pulse" />
            ) : (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-950 text-slate-300 border border-navy-700 font-bold uppercase">
                QUICK VERDICT
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  isReady
                    ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/20'
                    : hasFailures
                    ? 'border-rose-500/40 text-rose-300 bg-rose-500/20'
                    : 'border-cyan-500/40 text-cyan-300 bg-cyan-500/20'
                }`}
              >
                {quickVerdict?.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {quickVerdict?.headlineEn}
            </h3>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              🇮🇳 <strong className="text-teal-300">Saral Shabd:</strong> {quickVerdict?.headlineHi}
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 shrink-0">
          Total Analyzed Notes: <strong className="text-white">{notes.length}</strong>
        </div>
      </div>

      {/* 2. Side-by-Side Beginner Note Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {notes.map((note) => {
          const isNotePassed = note.status === 'Passed';
          const isNoteCritical = note.severity === 'Critical' || note.severity === 'High';

          return (
            <div
              key={note.index}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                isNoteCritical
                  ? 'border-rose-500/40 bg-navy-900/95 shadow-md shadow-rose-950/20'
                  : isNotePassed
                  ? 'border-emerald-500/30 bg-navy-900/80'
                  : 'border-navy-750 bg-navy-900/70'
              }`}
            >
              <div className="flex items-center justify-between border-b border-navy-800 pb-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-navy-950 border border-navy-700 text-cyan-400 text-[10px] flex items-center justify-center font-mono">
                    {note.index}
                  </span>
                  <span>{note.title}</span>
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    isNoteCritical
                      ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                      : isNotePassed
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  {note.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* English meaning */}
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                    🇬🇧 In Plain English
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans">{note.englishNote}</p>
                </div>

                {/* Hinglish meaning */}
                <div className="space-y-0.5 pt-1 border-t border-navy-850">
                  <span className="text-[10px] font-mono uppercase font-bold text-teal-400">
                    🇮🇳 Hinglish Mein
                  </span>
                  <p className="text-slate-300 leading-relaxed font-sans">{note.hinglishNote}</p>
                </div>
              </div>

              {/* Recommended Next Action */}
              <div className="pt-2 border-t border-navy-800/80 flex items-center gap-2 text-[11px] text-amber-300 font-mono">
                <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">Fix: {note.action}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Hackathon Jury Presentation Cheat-Sheet */}
      {howToExplainToJury.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-cyan-500/30 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 border-b border-navy-800 pb-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold text-white font-mono">
              Hackathon Jury Presentation Cheat-Sheet (How to explain to judges)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
            {howToExplainToJury.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-navy-950/90 border border-navy-800 space-y-1.5">
                <span className="text-[11px] font-mono font-bold text-cyan-300 block">
                  {item.point}
                </span>
                <p className="text-slate-200 text-xs leading-relaxed">{item.en}</p>
                <p className="text-slate-400 text-[11px] leading-relaxed border-t border-navy-850 pt-1">
                  🇮🇳 {item.hi}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
