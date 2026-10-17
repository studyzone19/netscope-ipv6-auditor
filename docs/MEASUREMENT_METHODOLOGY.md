# NetScope IPv6 Auditor - Measurement Methodology

## 1. Abstract
The goal of NetScope IPv6 Auditor is to quantify real-world, dependency-level IPv6 reachability for modern web applications. Measuring IPv6 readiness solely by inspecting root-level AAAA DNS records creates a false sense of compliance. Modern websites load dozens of critical third-party resources, CDNs, API endpoints, and script bundles whose connectivity profiles differ substantially from the origin server.

---

## 2. Browser Discovery Layer
Rather than relying on naive static HTML parsers or single HTTP GET requests, NetScope launches a real Chromium instance via Playwright.

**Why Browser-Level Discovery is Critical:**
1. **Dynamic DOM Hydration:** Client-side frameworks (React, Vue, Angular) dynamically request additional chunks, API endpoints, and styles after the initial HTML is parsed.
2. **Third-Party Script Loaders:** Analytics, payment gateways, and tag managers inject sub-resources asynchronously.
3. **Font and Media Probes:** Modern CSS `@font-face` declarations trigger network requests only when matching text elements render.

During the browser session, all HTTP transactions are captured, recording resource types, initiators, parent URLs, timestamps, and status codes.

---

## 3. The 7 Scientific Measurement Rules

### Rule 1: Circumventing Happy Eyeballs (RFC 8305)
Standard web browsers race IPv4 and IPv6 connections concurrently using RFC 8305. If IPv6 takes longer than 250ms or drops SYN packets, the browser silently serves the resource over IPv4. NetScope isolates the measurements by creating discrete, family-enforced OS sockets:
- IPv4 socket initialized with `family: 4`
- IPv6 socket initialized with `family: 6`

### Rule 2: An AAAA Record Alone Does Not Prove IPv6 Readiness
A domain can have an AAAA record published in DNS while:
- Ingress firewalls drop IPv6 SYN packets (black hole).
- The web server process only listens on `0.0.0.0` (IPv4) and not `[::]`.
- Upstream BGP routing lacks a valid IPv6 peering path.

### Rule 3: Missing AAAA Does Not Prove Transport Failure
A missing AAAA record is a DNS configuration gap, not a network transport failure. NetScope correctly classifies this as an `IPv6 DNS Failure` with root cause "Missing AAAA", recommending DNS provisioning rather than host firewall debugging.

### Rule 4: HTTP 404 is Not a Transport Failure
An HTTP 404 Not Found response confirms that:
1. DNS resolved.
2. TCP 3-way handshake finished.
3. TLS 1.3 handshake succeeded.
4. HTTP request was processed by the server.
Therefore, the transport layer is classified as `Passed` with an application note.

### Rule 5: CORS is Not an IPv6 Failure
A missing `Access-Control-Allow-Origin` header is an origin-level browser security policy. It is recorded as a browser-level attribute and never conflated with transport layer failures.

### Rule 6: Worker Vantage Point Honesty
Before any test runs, the measurement worker probes its local network stack for global unicast IPv6 addresses and runs an active probe to public resolvers (`2001:4860:4860::8888`). If the worker lacks native IPv6 connectivity, IPv6 measurements are marked as `Unsupported` rather than false negative failures.

### Rule 7: Denominator Integrity
Success rates and coverage metrics exclude unmeasured and unsupported resources from the denominator:
$$\text{Reachability Rate} = \frac{\text{IPv6 Reachable Tested Resources}}{\text{Total Tested Resources}} \times 100$$
Untested resources are displayed transparently and never assumed to have passed.

---

## 4. Failure Classification Taxonomy
Each measured resource is assigned an outcome:
- **`Passed`**: Both address families connected TCP, negotiated TLS, and returned valid HTTP responses.
- **`DNS failure`**: Missing AAAA record, NXDOMAIN, or resolver failure.
- **`TCP failure`**: Connection reset, refused (ECONNREFUSED), or host unreachable.
- **`TLS failure`**: Expired certificate, host mismatch, or cipher negotiation failure.
- **`HTTP error`**: Server returned 5xx Internal Server Error.
- **`Timeout`**: Handshake timed out (indicating SYN drops or PMTU black holes).
- **`Unsupported`**: Measurement worker lacks IPv6 route.
- **`Untested`**: Resource discovered but queued or excluded by budget limits.
- **`Inconclusive`**: Ambiguous network state.
