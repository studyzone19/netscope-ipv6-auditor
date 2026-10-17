import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Globe,
  Radio,
  Cpu,
  Shield,
  FileText,
  ExternalLink,
} from 'lucide-react';

export function Methodology() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono mb-2">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          Measurement Engineering Standard
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Scientific Measurement Methodology
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          How NetScope IPv6 Auditor measures, isolates, and classifies web dependencies to prove genuine dual-stack readiness beyond DNS heuristics.
        </p>
      </div>

      {/* The Core Thesis */}
      <div className="rounded-2xl bg-gradient-to-r from-navy-900 to-navy-850 border border-navy-750 p-6 md:p-8 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          The Dual-Stack Paradox: Why DNS is Not Enough
        </h2>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          In typical browser sessions, modern operating systems implement <strong>RFC 8305 (Happy Eyeballs v2)</strong>, which races IPv6 and IPv4 connection attempts simultaneously and silently falls back to IPv4 if IPv6 encounters even a small delay (250ms–300ms) or dropped SYN packets.
        </p>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          Consequently, a website may appear to load seamlessly for a dual-stack user even when its primary JavaScript bundle, CSS framework, or user authentication API completely fails over IPv6. When an IPv6-only client (such as mobile cellular networks running 464XLAT or pure IPv6 internal cloud subnets) visits that same site, these dependencies shatter.
        </p>
      </div>

      {/* The 7 Core Rules */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          The 7 Scientific Axioms of NetScope
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-navy-900 border border-navy-750 space-y-2">
            <span className="text-xs font-bold text-cyan-400 font-mono">Axiom 1</span>
            <h3 className="text-sm font-semibold text-white">Real Browser Execution Discovery</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Static HTML regex scraping fails to discover dependencies injected asynchronously by JavaScript bundles, React components, and CDN font loaders. NetScope runs a controlled Playwright Chromium session to capture all observed runtime network events.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-900 border border-navy-750 space-y-2">
            <span className="text-xs font-bold text-cyan-400 font-mono">Axiom 2</span>
            <h3 className="text-sm font-semibold text-white">The AAAA Record Fallacy</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              An AAAA record in DNS proves only that an author claimed an IPv6 address. It does not prove that TCP port 443 is bound, that edge security groups admit IPv6 ingress, or that the TLS certificate matches the host.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-900 border border-navy-750 space-y-2">
            <span className="text-xs font-bold text-cyan-400 font-mono">Axiom 3</span>
            <h3 className="text-sm font-semibold text-white">Address Family Socket Enforcement</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Happy Eyeballs must be circumvented during measurement. Sockets are explicitly opened with <code>family: 4</code> and <code>family: 6</code> independently against primary resolved IPs.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-900 border border-navy-750 space-y-2">
            <span className="text-xs font-bold text-cyan-400 font-mono">Axiom 4</span>
            <h3 className="text-sm font-semibold text-white">HTTP 404 Disassociation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              An HTTP 404 Not Found response is conclusive proof that DNS, TCP 3-way handshake, TLS 1.3 negotiation, and HTTP transport succeeded. Transport is classified as Passed with an application note.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-900 border border-navy-750 space-y-2">
            <span className="text-xs font-bold text-cyan-400 font-mono">Axiom 5</span>
            <h3 className="text-sm font-semibold text-white">CORS Disassociation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              A missing <code>Access-Control-Allow-Origin</code> header is a browser Same-Origin Policy enforcement mechanism. It is never classified as an IPv6 network transport drop.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-900 border border-navy-750 space-y-2">
            <span className="text-xs font-bold text-cyan-400 font-mono">Axiom 6</span>
            <h3 className="text-sm font-semibold text-white">Vantage Point Honesty</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              If the measurement worker node lacks an upstream native IPv6 route, NetScope reports IPv6 tests as <strong>Unsupported (Worker lacks IPv6)</strong> rather than fabricating passes or failures.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-900 border border-navy-750 space-y-2 md:col-span-2">
            <span className="text-xs font-bold text-cyan-400 font-mono">Axiom 7</span>
            <h3 className="text-sm font-semibold text-white">Strict Denominator Attribution</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reachability percentages exclude unmeasured or unsupported resources from the denominator to avoid artificially deflating or inflating compliance metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Relevant Network Standards */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Referenced Network RFC Standards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-cyan-400 font-bold block">RFC 8305</span>
            <span className="text-slate-300">Happy Eyeballs v2</span>
          </div>
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-teal-400 font-bold block">RFC 4291</span>
            <span className="text-slate-300">IPv6 Addressing Architecture</span>
          </div>
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-violet-400 font-bold block">RFC 4193</span>
            <span className="text-slate-300">Unique Local IPv6 Unicast</span>
          </div>
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-cyan-400 font-bold block">RFC 1918</span>
            <span className="text-slate-300">Private IPv4 Address Spaces</span>
          </div>
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-teal-400 font-bold block">RFC 3927</span>
            <span className="text-slate-300">IPv4 Link-Local (169.254/16)</span>
          </div>
          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
            <span className="text-violet-400 font-bold block">RFC 4180</span>
            <span className="text-slate-300">Standard CSV MIME Format</span>
          </div>
        </div>
      </div>
    </div>
  );
}
