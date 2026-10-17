# NetScope IPv6 Auditor - Core Audit Pipeline Pseudocode

```python
def run_full_audit_pipeline(target_url, options):
    # =========================================================================
    # STAGE 1: URL VALIDATION & SSRF DEFENSE
    # =========================================================================
    parsed_url = parse_url(target_url)
    assert parsed_url.protocol in ["http:", "https:"]
    assert not parsed_url.has_credentials()
    
    # Resolve pre-flight DNS and enforce RFC 1918/4291/3927 private IP blocking
    destination_ips = resolve_all_ips(parsed_url.hostname)
    for ip in destination_ips:
        if is_private_or_restricted(ip) and not is_controlled_lab(ip, options):
            raise SecurityException(f"Destination {ip} rejected by SSRF protection.")
            
    worker_capabilities = probe_local_worker_ipv6_routes()
    audit_record = database.create_audit(target_url, worker_capabilities)

    # =========================================================================
    # STAGE 2: BROWSER DEPENDENCY DISCOVERY
    # =========================================================================
    audit_record.update_stage("2/7: Real Browser Discovery via Playwright", progress=25)
    
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    
    discovered_resources = []
    
    page.on("request", lambda req: (
        discovered_resources.append(extract_metadata(req))
        if req.is_http() and len(discovered_resources) < options.max_resources
    ))
    
    page.goto(target_url, wait_until="domcontentloaded", timeout=options.timeout_ms)
    page.wait_for_timeout(2500) # Allow dynamic scripts and fetch calls to resolve
    browser.close()

    # =========================================================================
    # STAGE 3: DEPENDENCY EXTRACTION & PERSISTENCE
    # =========================================================================
    audit_record.update_stage("3/7: Dependency Relationship Extraction", progress=40)
    stored_resources = database.save_resources(audit_record.id, discovered_resources)

    # =========================================================================
    # STAGES 4 & 5: DUAL-STACK NETWORK MEASUREMENTS (ISOLATED FAMILY SOCKETS)
    # =========================================================================
    audit_record.update_stage("4/7: Measuring IPv4 & IPv6 Transports", progress=60)
    measurements = []
    
    for resource in stored_resources:
        dns_evidence = resolve_dns(resource.hostname) # A and AAAA records
        
        # IPv4 Measurement (Forced address family 4)
        if len(dns_evidence.a_records) > 0:
            ipv4_transport = measure_socket(
                ip=dns_evidence.a_records[0],
                port=resource.port,
                family=4,
                is_tls=resource.protocol == "https:"
            )
        else:
            ipv4_transport = TransportResult(outcome="DNS failure", error="No A record")
            
        # IPv6 Measurement (Forced address family 6)
        if not worker_capabilities.has_native_ipv6:
            ipv6_transport = TransportResult(outcome="Unsupported", error="Worker lacks IPv6")
        elif len(dns_evidence.aaaa_records) == 0:
            ipv6_transport = TransportResult(outcome="DNS failure", error="No AAAA record")
        else:
            ipv6_transport = measure_socket(
                ip=dns_evidence.aaaa_records[0],
                port=resource.port,
                family=6,
                is_tls=resource.protocol == "https:"
            )

        # =====================================================================
        # STAGE 6: SCIENTIFIC CLASSIFICATION & ROOT CAUSE ANALYSIS
        # =====================================================================
        classification = classify_measurement(
            dns_evidence,
            ipv4_transport,
            ipv6_transport,
            worker_capabilities
        )
        
        measurement_record = database.save_measurement(
            audit_id=audit_record.id,
            resource_id=resource.id,
            dns=dns_evidence,
            ipv4=ipv4_transport,
            ipv6=ipv6_transport,
            classification=classification
        )
        measurements.append(measurement_record)

    # =========================================================================
    # STAGE 7: SUMMARY METRICS & REPORT GENERATION
    # =========================================================================
    audit_record.summary = calculate_metrics(stored_resources, measurements)
    audit_record.update_stage("7/7: Report Generated & Ready", progress=100, status="completed")
    
    return audit_record
```
