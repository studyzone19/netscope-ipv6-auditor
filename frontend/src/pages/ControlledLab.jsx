import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle,
  AlertOctagon,
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Cpu,
} from 'lucide-react';
import { getLabManifest, validateLab } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';

export function ControlledLab() {
  const [manifest, setManifest] = useState(null);
  const [report, setReport] = useState(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getLabManifest()
      .then((res) => setManifest(res.manifest))
      .catch((err) => console.error(err));
  }, []);

  const handleRunValidation = async () => {
    setValidating(true);
    setError(null);
    try {
      const res = await validateLab();
      setReport(res.validation);
    } catch (err) {
      setError(err.message || 'Lab validation failed');
    } finally {
      setValidating(false);
    }
  };

  const summary = report?.summary;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono mb-2">
            <FlaskConical className="w-3.5 h-3.5 text-teal-400" />
            Empirical Ground-Truth Laboratory
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Controlled IPv6 Validation Lab
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            A deterministic, reproducible test suite designed to validate the measurement engine's accuracy, precision, and edge-case handling against known ground-truth behaviors.
          </p>
        </div>

        <button
          onClick={handleRunValidation}
          disabled={validating}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
        >
          {validating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating Test Cases...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-navy-950" />
              <span>Execute Lab Validation Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Scientific Rules Tested Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-navy-900 border border-navy-750 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Rule #1: HTTP 404 Disassociation
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            An HTTP 404 Not Found response is proof that lower-level TCP and TLS handshakes succeeded. It is classified as transport Passed, not a transport failure.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-navy-900 border border-navy-750 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Rule #2: CORS Disassociation
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            A CORS block is an origin security boundary enforced inside the browser DOM. It does not represent an IPv6 IP packet or TCP socket drop.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-navy-900 border border-navy-750 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Rule #3: AAAA Record Prerequisite
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Publishing an AAAA record is necessary but not sufficient. TCP SYN drops and broken dual-stack servers are verified through real socket probes.
          </p>
        </div>
      </div>

      {/* Validation Results (when run) */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Confusion Matrix & Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Test Suite Status"
              value={report.suiteStatus}
              icon={report.suiteStatus === 'PASSED' ? CheckCircle : AlertOctagon}
              accent={report.suiteStatus === 'PASSED' ? 'emerald' : 'rose'}
              tooltip="Overall ground-truth verification outcome"
            />
            <MetricCard
              title="Accuracy"
              value={`${summary?.accuracy || 100}%`}
              denominator={`(${summary?.correctDetections}/${summary?.totalTests})`}
              icon={Cpu}
              accent="teal"
              tooltip="(True Positives + True Negatives) / Total"
            />
            <MetricCard
              title="Precision & Recall"
              value={`${summary?.precision || 100}%`}
              denominator={`Recall: ${summary?.recall || 100}%`}
              icon={CheckCircle2}
              accent="cyan"
              tooltip="Zero false positives & zero false negatives"
            />
            <MetricCard
              title="F1-Score"
              value={`${summary?.f1Score || 100}%`}
              icon={FlaskConical}
              accent="violet"
              tooltip="Harmonic mean of precision and recall"
            />
          </div>

          {/* Confusion Matrix Table */}
          <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Confusion Matrix vs Ground Truth
            </h3>
            <div className="grid grid-cols-2 gap-4 max-w-lg text-xs font-mono">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-slate-400 block text-[11px]">True Positives (TP):</span>
                <span className="text-xl font-bold text-emerald-400">{summary?.truePositives}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Correctly detected IPv6 failures</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-slate-400 block text-[11px]">True Negatives (TN):</span>
                <span className="text-xl font-bold text-emerald-400">{summary?.trueNegatives}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Correctly verified dual-stack passes</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800">
                <span className="text-slate-400 block text-[11px]">False Positives (FP):</span>
                <span className="text-xl font-bold text-slate-300">{summary?.falsePositives}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">False alarm detections</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800">
                <span className="text-slate-400 block text-[11px]">False Negatives (FN):</span>
                <span className="text-xl font-bold text-slate-300">{summary?.falseNegatives}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Missed failures</span>
              </div>
            </div>

            {/* Environment limitations banner */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs font-mono text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{report.environmentLimitations?.notes}</span>
            </div>
          </div>

          {/* Test Cases Results Table */}
          <div className="rounded-2xl bg-navy-900 border border-navy-750 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-navy-750 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Detailed Test Manifest Comparison
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-navy-950/80 text-slate-400 border-b border-navy-750">
                  <tr>
                    <th className="py-3 px-4">Test ID & Name</th>
                    <th className="py-3 px-4">Endpoint Path</th>
                    <th className="py-3 px-4">Expected vs Actual</th>
                    <th className="py-3 px-4">Rule Tested</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-750 text-slate-200">
                  {report.testResults?.map((tc) => (
                    <tr key={tc.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mr-2">
                          {tc.id}
                        </span>
                        <span className="font-semibold text-white">{tc.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {tc.path}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] block">
                            Exp: {tc.expected.overall} (Fail: {tc.expected.isIpv6SpecificFailure ? 'Yes' : 'No'})
                          </span>
                          <span className="text-cyan-300 font-bold block">
                            Act: {tc.actual.overall} (Fail: {tc.actual.isIpv6SpecificFailure ? 'Yes' : 'No'})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={tc.ruleTested}>
                        {tc.ruleTested}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {tc.status === 'PASSED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" /> FAILED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Initial Manifest Preview when not validated yet */}
      {!report && manifest && (
        <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-semibold text-white">
            Available Test Cases in Ground-Truth Manifest ({manifest.testCases?.length || 0})
          </h3>
          <p className="text-xs text-slate-400">
            Click "Execute Lab Validation Suite" above to benchmark the measurement engine against these deterministic endpoints.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {manifest.testCases?.map((tc) => (
              <div key={tc.id} className="p-3.5 rounded-xl bg-navy-950/60 border border-navy-800 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">{tc.id}: {tc.name}</span>
                  <span className="text-[10px] text-slate-500">{tc.resourceType}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{tc.ruleTested}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
