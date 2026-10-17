# NetScope IPv6 Auditor - Security Specification & SSRF Protections

Network auditing engines that accept arbitrary user-supplied URLs must be defended against Server-Side Request Forgery (SSRF), internal network scanning, and denial-of-service vectors.

---

## 1. Threat Model & Defenses

### 1.1 IP Range & CIDR Deny-List
All submitted target hostnames are resolved pre-flight and checked against restricted address spaces:

| Address Block | Designation | RFC Standard | Action |
|---|---|---|---|
| `0.0.0.0/8` | Current network | RFC 1122 | **BLOCKED** |
| `10.0.0.0/8` | Private Class A | RFC 1918 | **BLOCKED** |
| `100.64.0.0/10` | Carrier-Grade NAT | RFC 6598 | **BLOCKED** |
| `127.0.0.0/8` | Loopback / Localhost | RFC 1122 | **BLOCKED** |
| `169.254.0.0/16` | IPv4 Link-Local / Cloud Metadata | RFC 3927 | **BLOCKED** |
| `172.16.0.0/12` | Private Class B | RFC 1918 | **BLOCKED** |
| `192.168.0.0/16` | Private Class C | RFC 1918 | **BLOCKED** |
| `224.0.0.0/4` | Multicast | RFC 5771 | **BLOCKED** |
| `240.0.0.0/4` | Reserved | RFC 1112 | **BLOCKED** |
| `::1` | IPv6 Loopback | RFC 4291 | **BLOCKED** |
| `fc00::/7` | Unique Local Address (ULA) | RFC 4193 | **BLOCKED** |
| `fe80::/10` | IPv6 Link-Local | RFC 4291 | **BLOCKED** |
| `::ffff:0:0/96` | IPv4-Mapped IPv6 | RFC 4291 | **BLOCKED** |

### 1.2 Cloud Metadata Protection
Special protection rules prevent requests from reaching cloud metadata services:
- `169.254.169.254` (AWS, GCP, Azure, OpenStack)
- `metadata.google.internal`
- `metadata.aws`
- `instance-data`

### 1.3 DNS Rebinding Mitigation
Attackers frequently use dynamic DNS records that resolve to a public IP on initial validation, but resolve to `127.0.0.1` when fetched by the socket or browser. NetScope mitigates this by:
1. Pre-resolving and validating all returned records.
2. Directly opening sockets to the validated destination IP address while supplying the SNI/Host header.

### 1.4 Browser Sandboxing & Isolation
- Playwright Chromium instances execute in headless mode with `--no-sandbox` strictly within isolated browser contexts.
- Cookies, storage, and sessions are immediately destroyed upon context termination.
- Default navigation timeout: 15–20 seconds max.
- Memory and resource limits prevent runaway tab bloat.

### 1.5 Controlled Lab Exception Boundary
The Controlled Lab running on `http://127.0.0.1:5005` is only accessible when the `allowLab` option is explicitly toggled by the user and the requested destination port strictly matches the configured `LAB_PORT` (5005). All other localhost ports remain strictly blocked.
