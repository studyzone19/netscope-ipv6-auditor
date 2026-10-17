# NetScope IPv6 Auditor - REST API Reference

The backend exposes a standardized RESTful API on default port `5000`. All JSON payloads adhere to consistent error and response envelopes.

---

## 1. Health & Vantage Point

### `GET /api/health`
Retrieves measurement worker status, uptime, and native IPv6 interface capabilities.

**Response:**
```json
{
  "status": "healthy",
  "service": "NetScope IPv6 Auditor API",
  "version": "1.0.0",
  "uptime": 142.5,
  "timestamp": "2026-10-17T04:10:00.000Z",
  "worker": {
    "hostname": "WORKER-NODE-01",
    "platform": "win32 x64",
    "hasNativeIpv6": true,
    "workerIpv6Addresses": ["2409:40d2:12eb:..."],
    "dnsResolvers": ["127.0.0.1", "8.8.8.8"]
  }
}
```

---

## 2. Audits

### `POST /api/audits`
Starts a new audit against the requested target URL.

**Request Body:**
```json
{
  "url": "https://www.google.com",
  "options": {
    "timeoutMs": 15000,
    "maxResources": 30,
    "allowLab": false
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Audit started successfully",
  "audit": {
    "_id": "6710891234567890abcdef12",
    "url": "https://www.google.com",
    "targetHost": "www.google.com",
    "status": "validating",
    "stage": "1/7: Validating Target URL & Pre-flight DNS",
    "progress": 10
  }
}
```

### `GET /api/audits`
Lists audits with pagination and status filtering.

**Query Parameters:**
- `page`: Integer (default: 1)
- `limit`: Integer (default: 20)
- `status`: String (`completed`, `running`, `failed`)

### `GET /api/audits/:id`
Retrieves a single audit by its ID including summary statistics and worker metadata.

### `GET /api/audits/:id/resources`
Retrieves all discovered resources and their associated measurements for the audit.

**Query Parameters:**
- `type`: Filter by resource type (`script`, `stylesheet`, `image`, `fetch`, etc.)
- `classification`: Filter by outcome (`Passed`, `DNS failure`, `TCP failure`, etc.)
- `isThirdParty`: Boolean string (`true`, `false`)

### `GET /api/audits/:id/graph`
Returns nodes and directed edges configured for rendering inside `@xyflow/react`.

---

## 3. 30-Site Benchmark

### `GET /api/benchmark`
Retrieves the current benchmark run state, summary reachability metrics, and list of 30 sites.

### `POST /api/benchmark/run`
Triggers batch execution of the benchmark with concurrency limits.

**Request Body:**
```json
{
  "concurrency": 2,
  "maxSites": 30
}
```

### `POST /api/benchmark/cancel`
Cancels the currently running batch execution.

---

## 4. Controlled Lab

### `GET /api/lab/manifest`
Returns the ground-truth test manifest defining test cases, endpoints, and expected rules.

### `POST /api/lab/validate`
Executes validation against the lab endpoints and computes the Confusion Matrix (TP, FP, TN, FN, Accuracy, Precision, Recall, F1).

---

## 5. Reports & Data Export

### `GET /api/reports/:id/json`
Returns an exhaustive, audit-grade JSON artifact of the audit run.

### `GET /api/reports/:id/csv`
Returns an RFC 4180 compliant CSV file download with `Content-Disposition: attachment; filename="netscope_audit_<id>.csv"`.
