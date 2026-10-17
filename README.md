# NetScope IPv6 Auditor

<div align="center">

```
  _   _      _   ____                                ___ ______       __
 | \ | | ___| |_/ ___|  ___ ___  _ __   ___         |_ _|  _ \ \   / / /_
 |  \| |/ _ \ __\___ \ / __/ _ \| '_ \ / _ \  _____  | || |_) \ \ / / '_ \
 | |\  |  __/ |_ ___) | (_| (_) | |_) |  __/ |_____| | ||  __/ \ V /| (_) |
 |_| \_|\___|\__|____/ \___\___/| .__/ \___|         |___|_|     \_/  \___/
                                |_|
```

### **Beyond DNS. Measure Every Dependency. Prove IPv6 Readiness.**

[![Tests](https://img.shields.io/badge/Tests-25%20Passed-10B981?style=for-the-badge&logo=vitest&logoColor=white)](docs/TESTING.md)
[![Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-06B6D4?style=for-the-badge&logo=vite&logoColor=white)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-14B8A6?style=for-the-badge&logo=node.js&logoColor=white)](backend/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20v8.2-13AA52?style=for-the-badge&logo=mongodb&logoColor=white)](backend/src/models/)
[![Engine](https://img.shields.io/badge/Browser-Playwright%20Chromium-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)](backend/src/services/discovery.js)

</div>

---

## 1. The Problem: The Dual-Stack Blindspot

A website is **never** truly IPv6-ready just because its apex domain advertises an AAAA record in DNS.

Modern web applications are composite ecosystems. When a client navigates to a URL, the browser executes HTML, which in turn downloads:
- JavaScript bundles from external CDNs
- Cascading Style Sheets (CSS)
- Web fonts
- Media assets and images
- Analytics trackers, tag managers, and ad scripts
- API endpoints (`fetch` / `XHR`) and embedded `iframe` widgets

### Why Happy Eyeballs Masks Critical Failures
Desktop browsers implement **RFC 8305 (Happy Eyeballs v2)**. If an IPv6 connection drops SYN packets or encounters latency, the browser silently falls back to IPv4 within 250 milliseconds. 

**The result?** Developers and DevOps teams believe their application is dual-stack compliant. But when mobile users on pure IPv6 networks (or enterprise environments without IPv4 addresses) access the site, dependencies fail silently, breaking UI components, authentication, and core functionality.

**NetScope IPv6 Auditor** unmasks this reality by combining **real headless browser resource discovery** with an **address-family-enforced raw network measurement engine**.

---

## 2. Key Capabilities & Feature Matrix

- **Browser Resource Discovery:** Automates Playwright Chromium to observe every dynamic dependency loaded during real DOM execution.
- **Strict Address Family Isolation:** Bypasses Happy Eyeballs by forcing independent `family: 4` and `family: 6` TCP sockets and TLS handshakes.
- **Interactive React Flow Dependency Graph:** Visualizes parent-child dependency trees with real-time status badges, minimap, zoom/pan controls, and deep inspection drawers.
- **Scientific Root Cause Taxonomy:** Accurately classifies failures into `DNS failure`, `TCP failure`, `TLS failure`, `HTTP error`, `Timeout`, and `Unsupported`.
- **Controlled Test Laboratory:** A deterministic test suite evaluated against ground-truth manifests, producing a live Confusion Matrix (100% Accuracy, 100% Precision, 100% Recall).
- **30-Site Industry Benchmark:** Batch testing engine measuring dual-stack parity across Search & Cloud, Tech, Media, Retail, and Government sectors.
- **SSRF & Cybersecurity Protections:** Comprehensive pre-flight CIDR blocking (RFC 1918, RFC 4291, RFC 3927) and cloud metadata endpoint defense.
- **Audit-Grade Reports:** Instant in-browser previews and one-click downloads for real **JSON** and **CSV (RFC 4180)** datasets.

---

## 3. High-Level System Architecture

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

## 4. The 7-Stage Observable Audit Workflow

When an audit is launched, NetScope progresses through 7 observable stages tracked in real-time by the frontend:

1. **URL Validation & SSRF Defense:** Pre-flight DNS resolution, RFC 1918/4291 address blocking, and protocol scheme validation.
2. **Real Browser Discovery:** Playwright Chromium navigates the site, capturing all dynamic requests, initiators, and response statuses.
3. **Dependency Relationship Extraction:** Resources are classified by MIME type, flagged for 3rd-party origins, and stored in MongoDB.
4. **IPv4 Transport Measurements:** Resolves A records, opens raw TCP socket (`family: 4`), negotiates TLS SNI, and sends HTTP probe.
5. **IPv6 Transport Measurements:** Resolves AAAA records, opens raw TCP socket (`family: 6`), negotiates TLS SNI, and sends HTTP probe.
6. **Scientific Classification:** Evaluates dual-stack parity, flags IPv6-specific failures, generates root cause analysis and DevOps recommendations.
7. **Report Generation:** Compiles coverage statistics, dependency graph coordinates, and prepares JSON/CSV download artifacts.

---

## 5. Scientific Measurement Axioms

NetScope strictly follows these 7 scientific principles:

1. **AAAA Record != Readiness:** Publishing an AAAA record does not guarantee that ingress port 443 is open or bound on `[::]`.
2. **Missing AAAA != Transport Failure:** A missing AAAA record is an authoritative DNS provisioning defect, not a TCP socket reset.
3. **HTTP 404 is NOT a Transport Failure:** A 404 response confirms that DNS, TCP handshake, TLS negotiation, and HTTP framing all succeeded.
4. **CORS is NOT an IPv6 Failure:** Same-Origin Policy blocks occur inside the browser DOM and must never be conflated with network packet loss.
5. **No Forced Fallback Assumption:** Sockets are isolated using OS-level flags to prevent Happy Eyeballs from concealing transport drops.
6. **Vantage Point Honesty:** If the worker environment lacks native IPv6 transit, tests are marked **Unsupported** rather than fabricating results.
7. **Denominator Integrity:** Untested or unmeasured resources are strictly excluded from success rate denominators:
   $$\text{IPv6 Reachability Rate} = \left(\frac{\text{IPv6 Reachable Tested Resources}}{\text{Total Tested Resources}}\right) \times 100$$

---

## 6. Project Directory Layout

```
netscope-ipv6-auditor/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── controllers/     # API endpoint controllers
│   │   ├── models/          # Mongoose database schemas (Audit, Resource, Measurement, BenchmarkRun)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/
│   │   │   ├── security.js  # SSRF, CIDR, and DNS rebinding protections
│   │   │   ├── discovery.js # Playwright browser session runner
│   │   │   ├── measurement.js # Dual-stack socket measurement engine
│   │   │   ├── pipeline.js  # 7-stage audit pipeline coordinator
│   │   │   ├── graph.js     # React Flow graph layout generator
│   │   │   ├── benchmark.js # 30-site benchmark runner
│   │   │   ├── lab.js       # Ground-truth validator & confusion matrix
│   │   │   └── reports.js   # JSON & RFC 4180 CSV export generator
│   │   └── server.js        # Server bootstrap & embedded lab launcher
│   ├── test/                # Vitest backend test suite & E2E runner
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # UI components (Layout, StatusBadge, MetricCard, ResourceDrawer, CustomNodes)
│   │   ├── pages/           # 9 Dashboard views (Overview, NewAudit, ScanHistory, Explorer, Parity, Benchmark, Lab, Reports, Methodology)
│   │   ├── test/            # Vitest component tests
│   │   ├── App.jsx          # React Router setup
│   │   └── index.css        # Tailwind styling & dark theme overrides
│   ├── vite.config.js       # Vite configuration with API proxy
│   └── package.json
├── controlled-lab/
│   ├── manifest.json        # Ground-truth test manifest (8 scenarios)
│   └── server.js            # Standalone HTTP test server (port 5005)
├── docs/                    # Architecture, API, Security, Lab, and Methodology specifications
└── README.md
```

---

## 7. Quick Start & Execution Guide

### Prerequisites
- **Node.js:** v18+ (tested on v20.20.1)
- **MongoDB:** v6+ (running on default `mongodb://127.0.0.1:27017`)
- **Git**

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd netscope-ipv6-auditor

# Install Backend Dependencies & Playwright Browser
cd backend
npm install
npx playwright install chromium

# Install Frontend Dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment
A ready-to-use `.env.example` is provided:
```bash
cd ../backend
cp .env.example .env
```

### Step 3: Run the Test Suites

```bash
# Run Backend Tests (22 unit & integration tests)
cd backend
npm test

# Run Frontend Tests (3 component tests)
cd ../frontend
npm test

# Run Frontend Production Build
npm run build
```

### Step 4: Start the Applications

Open two terminal windows:

**Terminal 1 (Backend API & Embedded Controlled Lab):**
```bash
cd backend
npm start
```
*API will start on `http://127.0.0.1:5000` and Controlled Lab on `http://127.0.0.1:5005`.*

**Terminal 2 (Frontend Dashboard):**
```bash
cd frontend
npm run dev
```
*Dashboard will open on `http://localhost:3000` with automatic `/api` proxying.*

---

## 8. Verified Test Report

| Test Suite | File | Tests | Status |
|---|---|---|---|
| Security & SSRF Protection | `backend/test/security.test.js` | 8 | **PASSED** |
| Failure Classification Engine | `backend/test/classification.test.js` | 6 | **PASSED** |
| Dependency Graph & Controlled Lab | `backend/test/graph_lab.test.js` | 3 | **PASSED** |
| REST API Integration | `backend/test/api.test.js` | 5 | **PASSED** |
| Frontend UI Components | `frontend/src/test/components.test.jsx` | 3 | **PASSED** |
| Full End-to-End Audit | `backend/test/test_runner.js` | 1 | **PASSED** |
| **Total** | | **26 Tests** | **100% PASS** |

---

## 9. Controlled Lab Ground Truth Validation

The controlled test suite verifies our measurement engine against known ground-truth behaviors:

| Test Case | Scenario | Expected | Actual | Outcome |
|---|---|---|---|---|
| **TC-01** | Dual-stack endpoint | Passed | Passed | **VERIFIED** |
| **TC-02** | HTTP 404 response | Passed (Transport OK) | Passed | **VERIFIED** |
| **TC-03** | HTTP 500 error | HTTP error | HTTP error | **VERIFIED** |
| **TC-04** | CORS restriction | Passed (Transport OK) | Passed | **VERIFIED** |
| **TC-05** | Missing AAAA record | DNS failure | DNS failure | **VERIFIED** |
| **TC-06** | IPv6 TCP drop / reset | TCP failure | TCP failure | **VERIFIED** |
| **TC-07** | Stylesheet delivery | Passed | Passed | **VERIFIED** |
| **TC-08** | JavaScript delivery | Passed | Passed | **VERIFIED** |

**Confusion Matrix Results:**
- **Accuracy:** 100%
- **Precision:** 100%
- **Recall:** 100%
- **F1-Score:** 100%
- **False Positives:** 0
- **False Negatives:** 0

---

## 10. License
NetScope IPv6 Auditor is open-source software built for hackathon competition and network engineering research.
