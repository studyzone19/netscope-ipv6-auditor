# NetScope IPv6 Auditor - System Architecture

**Tagline:** Beyond DNS. Measure Every Dependency. Prove IPv6 Readiness.

NetScope IPv6 Auditor is a full-stack network measurement and observability platform designed to solve the critical "Dual-Stack Blindspot." 

Modern websites do not operate in a vacuum. A root domain may advertise an AAAA record, but its client-side JavaScript, external stylesheets, analytics endpoints, media CDNs, and third-party APIs often fail over IPv6 transport. Because modern operating systems implement RFC 8305 (Happy Eyeballs v2), transient or systemic IPv6 failures are masked by transparent fallback to IPv4.

NetScope unmasks this reality by decoupling the observation layer (controlled browser session) from an address-family-enforced network measurement pipeline.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 USER BROWSER                                      |
|                                                                                   |
|  [ React 18 + Vite + Tailwind CSS + React Flow Interactive Dependency Explorer ]  |
+------------------------------------------+----------------------------------------+
                                           | HTTP REST / JSON API (Port 5000)
                                           v
+-----------------------------------------------------------------------------------+
|                           NETSCOPE BACKEND (Node.js)                              |
|                                                                                   |
|  +-----------------------+   +------------------------+   +--------------------+  |
|  | SSRF & Security Engine|-->| Browser Discovery      |-->| Resource Extractor |  |
|  | (RFC 1918/4291/3927)  |   | (Playwright / Chromium)|   | & MongoDB Models   |  |
|  +-----------------------+   +------------------------+   +--------------------+  |
|                                                                     |             |
|                                                                     v             |
|  +-----------------------------------------------------------------------------+  |
|  |                    INDEPENDENT MEASUREMENT ENGINE                           |  |
|  |                                                                             |  |
|  |  [ DNS Resolver ]   --> A & AAAA latency, CNAME tracking, resolver metadata |  |
|  |  [ IPv4 Sockets ]   --> Family: 4 TCP Connect, TLS Handshake, HTTP Probe    |  |
|  |  [ IPv6 Sockets ]   --> Family: 6 TCP Connect, TLS Handshake, HTTP Probe    |  |
|  |  [ Classifier ]     --> Scientific Root Cause & Dual-Stack Parity Verdict   |  |
|  +-----------------------------------------------------------------------------+  |
|                                      |                                            |
|                                      v                                            |
|  +-----------------------+   +------------------------+   +--------------------+  |
|  | 30-Site Benchmark     |   | Controlled Lab Engine  |   | Report Exporter    |  |
|  | Batch Runner          |   | (Ground-Truth Suite)   |   | (JSON & CSV)       |  |
|  +-----------------------+   +------------------------+   +--------------------+  |
+------------------------------------------+----------------------------------------+
                                           | Native TCP Port 27017
                                           v
+-----------------------------------------------------------------------------------+
|                        MONGODB REPOSITORY (Local v8.2)                            |
|                                                                                   |
|  Collections: Audits | Resources | Measurements | BenchmarkRuns                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Components

### 2.1 Frontend Observability Dashboard (`/frontend`)
- **Framework:** React 18 with Vite for rapid HMR and optimized production bundles.
- **Styling:** Tailwind CSS with a customized dark network-observability theme (navy `#0B1120`, cyan `#06B6D4`, teal `#14B8A6`, subtle violet `#8B5CF6`).
- **Graph Visualization:** `@xyflow/react` (React Flow) providing dynamic node layouts, custom status badges, animated transport edges, minimap, zoom/pan controls, and deep inspection drawers.
- **Charts:** `recharts` for reachability donut distributions, resource type breakdowns, and latency comparisons.
- **Routing:** `react-router-dom` with 9 dedicated observability views.

### 2.2 Security & SSRF Engine (`/backend/src/services/security.js`)
- Pre-flight address validation before network sockets or browser instances are spawned.
- Blocks RFC 1918 (IPv4 private subnets), RFC 3927 (IPv4 link-local), RFC 4193 (IPv6 Unique Local), RFC 4291 (IPv4-mapped IPv6 `::ffff:0:0/96`), and cloud metadata endpoints (`169.254.169.254`).
- Verifies resolved IP destinations on pre-flight and on all HTTP redirect hops to mitigate DNS rebinding attacks.

### 2.3 Headless Browser Resource Discovery (`/backend/src/services/discovery.js`)
- Automates Playwright Chromium in isolated, headless sandbox environments.
- Monitors network-level request, response, and requestfailed hooks.
- Captures scripts, stylesheets, fonts, images, subframes, fetch/XHR, initiators, and parent-child dependency edges.

### 2.4 Independent Dual-Stack Measurement Engine (`/backend/src/services/measurement.js`)
- Enforces separate, isolated network probes:
  - **IPv4:** Queries A records, connects TCP socket with `family: 4`, negotiates TLS, performs HTTP probe.
  - **IPv6:** Queries AAAA records, connects TCP socket with `family: 6`, negotiates TLS, performs HTTP probe.
- Evaluates TCP round-trip duration, TLS version, cipher negotiation, and HTTP response codes.
- Assesses local worker vantage point capabilities to avoid attributing local routing deficiencies to remote targets.

### 2.5 Controlled Lab Server (`/controlled-lab/server.js`)
- Independent HTTP server (port 5005) exposing positive controls (dual-stack pass) and deterministic edge cases (missing AAAA, TCP drop, 404 transport pass, CORS restriction, 500 server error).
- Evaluated against `manifest.json` to compute confusion matrix (Accuracy, Precision, Recall, F1-Score).

### 2.6 Persistence Layer (`/backend/src/models`)
- **Audit:** High-level audit runs, options, summary statistics, worker vantage point metadata.
- **Resource:** Discovered URLs, MIME/types, initiators, parents, status codes.
- **Measurement:** DNS records, IPv4 transport, IPv6 transport, unified classification, recommended next steps.
- **BenchmarkRun:** Multi-site batch execution state and progress.
