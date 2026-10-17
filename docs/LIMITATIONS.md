# NetScope IPv6 Auditor - Known Limitations & Environmental Dependencies

In accordance with Section 1 of the specification (*"Never fabricate test results or claim that an unexecuted test passed"*), this document outlines the operational boundaries and environment prerequisites of the NetScope measurement engine.

---

## 1. Upstream IPv6 Transit & Worker Routing
- **Prerequisite:** For NetScope to test physical IPv6 TCP handshakes and TLS negotiations to external third-party hosts, the measurement worker node must have an active IPv6 default gateway and upstream ISP/cloud IPv6 transit.
- **Handling when IPv6 Transit is Absent:** NetScope actively detects worker interfaces at startup. If the worker lacks an IPv6 default route, external IPv6 measurements are marked as `Unsupported (Worker lacks native IPv6 route)` rather than claiming tests passed or failed.
- **Controlled Lab Synthetic Validation:** The Controlled Lab provides synthetic test cases to validate classification algorithms regardless of host network environment.

---

## 2. Dynamic Single-Page Applications (SPAs)
- Headless browser sessions capture resources triggered during page navigation and within a standard 2.5-second settling window.
- Resources loaded solely in response to deep user interactions (e.g. clicking sub-menus, navigating modal dialogs, or scrolling infinite feeds) will only be discovered if explicitly navigated or if a full session replay is executed.

---

## 3. Bot Protection & Cloudflare Turnstile / Akamai Bot Manager
- Some enterprise websites deploy aggressive bot detection algorithms that challenge headless Chromium sessions with CAPTCHA or Managed Challenges.
- When an anti-bot challenge is triggered, NetScope records the resources served up to that point and notes `Navigation Error / Captcha Challenge` in the audit summary rather than claiming the origin is down.

---

## 4. CDN Anycast & Geographic Routing
- DNS answers (both A and AAAA) depend on the authoritative nameserver's geographic routing policies and EDNS Client Subnet (ECS) headers.
- Measurements reflect the network path and CDN edge node observed from the worker's geographical vantage point.
