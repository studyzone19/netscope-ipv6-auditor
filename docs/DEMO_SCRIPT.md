# NetScope IPv6 Auditor - Mentor & Hackathon Demo Script

This script provides a 3-minute presentation and live walkthrough of NetScope IPv6 Auditor for hackathon mentors and judges.

---

## 1. The Hook (30 seconds)
> "Judges, over 45% of global internet traffic runs on IPv6, and cellular carriers are rapidly migrating to IPv6-only networks with 464XLAT.
> 
> But here is the problem: almost every network audit tool looks only at DNS. If `domain.com` has an AAAA record, they check a box and say 'IPv6 Ready'.
> 
> That is a dangerous illusion. Modern websites are composite applications loading dozens of third-party JavaScript files, font CDNs, CSS stylesheets, and API endpoints. If any of those fail over IPv6, Happy Eyeballs silently hides it on desktop by falling back to IPv4. But on IPv6-only networks, user experiences break.
> 
> We built **NetScope IPv6 Auditor**. Tagline: *Beyond DNS. Measure Every Dependency. Prove IPv6 Readiness.*"

---

## 2. Live System Walkthrough (2 minutes)

### Step 1: Real-Time Audit Execution
1. Open the dashboard at `http://localhost:3000`.
2. Click **New Audit**.
3. Select `https://github.com` or enter `https://www.google.com`.
4. Click **Start Comprehensive IPv6 Audit**.
5. Show the **7-Stage Workflow Stepper**:
   - Stage 1: URL validation & SSRF defense
   - Stage 2: Headless Playwright Chromium discovery
   - Stage 3: Dependency extraction & persistence
   - Stage 4 & 5: Isolated family-enforced socket probes
   - Stage 6: Scientific failure classification
   - Stage 7: Report generation
6. Point out: *"Notice that this is not a mock or timer. It is running an actual Playwright browser session in the background and recording raw TCP/TLS handshakes."*

### Step 2: Interactive Dependency Explorer (The Wow Factor)
1. Click **Explore Dependency Graph**.
2. Show the React Flow visualization:
   - Root website node in the center.
   - Child nodes categorized by type: Scripts, Stylesheets, Images, APIs.
   - Green nodes for dual-stack compliance; Red/Rose nodes for IPv6 failures.
3. Click a node to open the **Resource Drawer**:
   - Highlight the side-by-side IPv4 vs IPv6 evidence: Target IP, TCP latency in milliseconds, TLS version, HTTP status.
   - Point to the **Root Cause Analysis & Recommended Next Step** banner: *"NetScope doesn't just say 'Failed'—it tells the network engineer exactly what is wrong, such as checking ingress firewall rules or provisioning missing AAAA records."*

### Step 3: Scientific Rigor & The Controlled Lab
1. Navigate to **Controlled Lab** in the sidebar.
2. Click **Execute Lab Validation Suite**.
3. Show the **Confusion Matrix**:
   - 100% Accuracy, Zero False Positives, Zero False Negatives.
   - Highlight the edge case tests:
     - *"HTTP 404 is NOT a transport failure—the transport passed."*
     - *"CORS is a browser DOM policy—not an IPv6 network failure."*
     - *"We prove that an AAAA record alone does not equal connectivity."*

### Step 4: 30-Site Benchmark & Audit Reports
1. Navigate to **30-Site Benchmark** to show the categorized industry study.
2. Navigate to **Reports** and click **Download CSV** or **Download JSON** to show real exportable artifacts matching database records.

---

## 3. The Closing (30 seconds)
> "NetScope bridges network measurement engineering, cybersecurity SSRF defenses, and interactive observability. It unmasks the silent failures hiding behind Happy Eyeballs and provides engineering teams with the ground-truth data they need to prove genuine IPv6 readiness."
