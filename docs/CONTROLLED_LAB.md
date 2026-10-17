# NetScope IPv6 Auditor - Controlled Test Lab

The Controlled Lab is an independent, reproducible test harness designed to validate the measurement engine's classification accuracy against known ground-truth endpoints.

---

## 1. Overview
The lab runs an embedded Node.js HTTP server on port `5005` (configurable via `LAB_PORT`). It serves a suite of deterministic test cases specified in `controlled-lab/manifest.json`.

---

## 2. Test Manifest Specification

| Test ID | Endpoint Path | Resource Type | Expected IPv4 | Expected IPv6 | Expected Overall | Rule Verified |
|---|---|---|---|---|---|---|
| **TC-01** | `/api/dual-stack-pass` | fetch | Passed | Passed | **Passed** | Positive control for healthy dual-stack service |
| **TC-02** | `/api/http-404-error` | fetch | Passed | Passed | **Passed** | HTTP 404 is NOT a transport failure |
| **TC-03** | `/api/http-500-error` | fetch | HTTP error | HTTP error | **HTTP error** | Distinguishes app errors from network drops |
| **TC-04** | `/api/cors-restricted` | fetch | Passed | Passed | **Passed** | CORS restriction != network transport drop |
| **TC-05** | `/api/ipv4-only-sim` | fetch | Passed | DNS failure | **DNS failure** | Missing AAAA record simulation |
| **TC-06** | `/api/broken-ipv6-tcp` | fetch | Passed | TCP failure | **TCP failure** | AAAA record present, but TCP SYN dropped |
| **TC-07** | `/style.css` | stylesheet | Passed | Passed | **Passed** | Static CSS delivery verification |
| **TC-08** | `/app.js` | script | Passed | Passed | **Passed** | Static JS module delivery verification |

---

## 3. Running the Controlled Lab

### Option A: Via Dashboard (Recommended)
1. Open the NetScope dashboard in your browser.
2. Navigate to **Controlled Lab** in the sidebar.
3. Click **Execute Lab Validation Suite**.
4. The dashboard will execute all test cases, compare actual outputs with the manifest, and display the Confusion Matrix.

### Option B: Via Backend API
```bash
curl -X POST http://127.0.0.1:5000/api/lab/validate
```

### Option C: Standalone Server Mode
```bash
node controlled-lab/server.js
```
The server will listen on `http://127.0.0.1:5005` and serve the test assets.
