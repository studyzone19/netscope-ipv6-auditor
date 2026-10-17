# NetScope IPv6 Auditor - Test Instructions & Verification Suite

This project includes unit tests, integration tests, and end-to-end audit verification tests.

---

## 1. Running Backend Tests
The backend test suite covers:
- URL validation and SSRF defenses (RFC 1918, RFC 4291, Cloud Metadata)
- Failure classification engine (DNS, TCP, TLS, Timeout, HTTP errors)
- React Flow dependency graph construction
- Controlled lab manifest validation and confusion matrix
- REST API endpoints and health checks

Run backend tests using Vitest:
```bash
cd backend
npm test
```

Expected output:
```
 ✓ test/classification.test.js (6 tests)
 ✓ test/security.test.js (8 tests)
 ✓ test/graph_lab.test.js (3 tests)
 ✓ test/api.test.js (5 tests)

Test Files  4 passed (4)
     Tests  22 passed (22)
```

---

## 2. Running Frontend Tests
The frontend test suite covers:
- Status badge formatting and IPv6-specific failure indicators
- Metric card calculations and denominators
- Component rendering

Run frontend tests using Vitest:
```bash
cd frontend
npm test
```

---

## 3. Running Production Build
To verify that the frontend bundles cleanly without errors:
```bash
cd frontend
npm run build
```

---

## 4. Running Live E2E Audit
To run an automated live audit against a public site with Playwright Chromium:
```bash
cd backend
node test/test_runner.js
```
This script navigates to `https://www.google.com`, discovers dependencies, executes socket measurements, computes reachability metrics, and exports JSON and CSV reports to verify end-to-end functionality.
