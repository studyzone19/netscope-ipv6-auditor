import dns from 'dns/promises';
import dnsSync from 'dns';
import net from 'net';
import tls from 'tls';
import http from 'http';
import https from 'https';
import os from 'os';
import { getIpGeoContext } from '../utils/geo.js';

// Configure reliable global DNS resolvers to prevent local ISP DNS64 synthesis
try {
  dnsSync.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

// Cache worker capabilities
let workerCapabilitiesCache = null;

/**
 * Checks if an IPv6 address is a synthetic NAT64 translation prefix (RFC 6052)
 */
export function isSyntheticNat64(ip) {
  if (!ip) return false;
  const normalized = ip.toLowerCase();
  return normalized.startsWith('64:ff9b::') || normalized.startsWith('64:ff9b:');
}

/**
 * Probes the local worker machine to verify native IPv4 and IPv6 connectivity.
 */
export async function probeWorkerCapabilities() {
  if (workerCapabilitiesCache) {
    return workerCapabilitiesCache;
  }

  const hostname = os.hostname();
  const platform = `${os.platform()} ${os.arch()}`;
  const dnsResolvers = dnsSync.getServers();

  // Inspect network interfaces for global unicast IPv6 addresses
  const interfaces = os.networkInterfaces();
  const workerIpv6Addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv6' && !iface.internal) {
        // Exclude link-local (fe80::) and loopback (::1)
        if (!iface.address.toLowerCase().startsWith('fe80:') && iface.address !== '::1') {
          workerIpv6Addresses.push(iface.address);
        }
      }
    }
  }

  // Active socket probe to Cloudflare / Google public IPv6 DNS (port 53/80)
  let hasNativeIpv6 = false;
  if (workerIpv6Addresses.length > 0) {
    try {
      await new Promise((resolve, reject) => {
        // Google Public DNS IPv6: 2001:4860:4860::8888 or Cloudflare 2606:4700:4700::1111
        const socket = net.createConnection({
          host: '2001:4860:4860::8888',
          port: 53,
          family: 6,
          timeout: 2500,
        });

        socket.on('connect', () => {
          hasNativeIpv6 = true;
          socket.destroy();
          resolve();
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve(); // Resolve anyway, probe simply timed out
        });

        socket.on('error', () => {
          socket.destroy();
          resolve();
        });
      });
    } catch (_) {
      hasNativeIpv6 = false;
    }
  }

  workerCapabilitiesCache = {
    hostname,
    platform,
    hasNativeIpv6,
    workerIpv6Addresses,
    dnsResolvers,
    timestamp: new Date(),
  };

  return workerCapabilitiesCache;
}

/**
 * Resolves DNS A and AAAA records for a host with latency measurement.
 */
export async function resolveHostDns(host) {
  const startTime = Date.now();
  const dnsEvidence = {
    queryHost: host,
    aRecords: [],
    aaaaRecords: [],
    cnames: [],
    lookupDurationMs: 0,
    resolverUsed: dnsSync.getServers()[0] || 'System Default',
    outcome: 'SKIPPED',
    error: null,
  };

  try {
    try {
      const [aResult, aaaaResult] = await Promise.allSettled([
        dns.resolve4(host),
        dns.resolve6(host),
      ]);

      if (aResult.status === 'fulfilled' && aResult.value?.length > 0) {
        dnsEvidence.aRecords = aResult.value;
      }
      if (aaaaResult.status === 'fulfilled' && aaaaResult.value?.length > 0) {
        dnsEvidence.aaaaRecords = aaaaResult.value;
      }
    } catch (_) {}

    // Fallback to native OS lookup if either or both are empty
    if (dnsEvidence.aRecords.length === 0 || dnsEvidence.aaaaRecords.length === 0) {
      try {
        const osLookups = await dns.lookup(host, { all: true });
        for (const item of osLookups) {
          if (item.family === 4 && !dnsEvidence.aRecords.includes(item.address)) {
            dnsEvidence.aRecords.push(item.address);
          } else if (item.family === 6 && !dnsEvidence.aaaaRecords.includes(item.address)) {
            // Exclude synthetic NAT64 addresses (64:ff9b::/96)
            if (!isSyntheticNat64(item.address)) {
              dnsEvidence.aaaaRecords.push(item.address);
            }
          }
        }
      } catch (_) {}
    }

    // Double-check: ensure no synthetic NAT64 addresses remain in aaaaRecords
    dnsEvidence.aaaaRecords = dnsEvidence.aaaaRecords.filter((ip) => !isSyntheticNat64(ip));

    dnsEvidence.lookupDurationMs = Date.now() - startTime;

    if (dnsEvidence.aRecords.length > 0 && dnsEvidence.aaaaRecords.length > 0) {
      dnsEvidence.outcome = 'SUCCESS';
    } else if (dnsEvidence.aRecords.length > 0 && dnsEvidence.aaaaRecords.length === 0) {
      dnsEvidence.outcome = 'NO_AAAA';
    } else if (dnsEvidence.aRecords.length === 0 && dnsEvidence.aaaaRecords.length > 0) {
      dnsEvidence.outcome = 'NO_A';
    } else {
      dnsEvidence.outcome = 'NXDOMAIN';
      dnsEvidence.error = 'No A or AAAA records found for host';
    }
  } catch (err) {
    dnsEvidence.lookupDurationMs = Date.now() - startTime;
    dnsEvidence.outcome = 'ERROR';
    dnsEvidence.error = err.message;
  }

  return dnsEvidence;
}

/**
 * Measures raw TCP connection and TLS handshake to a specific target IP and port.
 */
export function measureTransport({ ip, port, host, isTls, family, timeoutMs = 4000 }) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let tcpDurationMs = 0;
    let tcpConnected = false;
    let tlsHandshake = false;
    let tlsDurationMs = 0;
    let tlsVersion = null;
    let tlsCipher = null;
    let error = null;
    let outcome = 'Untested';

    const socket = net.createConnection({
      host: ip,
      port,
      family,
      timeout: timeoutMs,
    });

    socket.on('connect', () => {
      tcpConnected = true;
      tcpDurationMs = Date.now() - startTime;

      if (!isTls) {
        outcome = 'Passed';
        socket.destroy();
        resolve({
          tested: true,
          destinationIp: ip,
          tcpConnected,
          tcpDurationMs,
          tlsHandshake,
          tlsDurationMs,
          tlsVersion,
          tlsCipher,
          outcome,
          error,
        });
        return;
      }

      // Upgrade socket to TLS
      const tlsStartTime = Date.now();
      const tlsSocket = tls.connect({
        socket,
        servername: host,
        rejectUnauthorized: false, // We record certificate validity separately
        timeout: timeoutMs,
      });

      tlsSocket.on('secureConnect', () => {
        tlsHandshake = true;
        tlsDurationMs = Date.now() - tlsStartTime;
        const cipher = tlsSocket.getCipher();
        tlsCipher = cipher ? cipher.name : null;
        tlsVersion = tlsSocket.getProtocol();

        outcome = 'Passed';
        tlsSocket.destroy();
        resolve({
          tested: true,
          destinationIp: ip,
          tcpConnected,
          tcpDurationMs,
          tlsHandshake,
          tlsDurationMs,
          tlsVersion,
          tlsCipher,
          outcome,
          error: null,
        });
      });

      tlsSocket.on('timeout', () => {
        tlsSocket.destroy();
        outcome = 'Timeout';
        error = 'TLS handshake timeout';
        resolve({
          tested: true,
          destinationIp: ip,
          tcpConnected,
          tcpDurationMs,
          tlsHandshake: false,
          tlsDurationMs: Date.now() - tlsStartTime,
          tlsVersion,
          tlsCipher,
          outcome,
          error,
        });
      });

      tlsSocket.on('error', (err) => {
        tlsSocket.destroy();
        outcome = 'TLS failure';
        error = err.message;
        resolve({
          tested: true,
          destinationIp: ip,
          tcpConnected,
          tcpDurationMs,
          tlsHandshake: false,
          tlsDurationMs: Date.now() - tlsStartTime,
          tlsVersion,
          tlsCipher,
          outcome,
          error,
        });
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      outcome = 'Timeout';
      error = 'TCP connection timed out';
      resolve({
        tested: true,
        destinationIp: ip,
        tcpConnected: false,
        tcpDurationMs: Date.now() - startTime,
        tlsHandshake: false,
        tlsDurationMs: 0,
        tlsVersion,
        tlsCipher,
        outcome,
        error,
      });
    });

    socket.on('error', (err) => {
      socket.destroy();
      error = err.message;
      if (err.code === 'ECONNREFUSED') {
        outcome = 'TCP failure';
      } else if (err.code === 'ETIMEDOUT') {
        outcome = 'Timeout';
      } else if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') {
        outcome = 'TCP failure';
      } else {
        outcome = 'TCP failure';
      }

      resolve({
        tested: true,
        destinationIp: ip,
        tcpConnected: false,
        tcpDurationMs: Date.now() - startTime,
        tlsHandshake: false,
        tlsDurationMs: 0,
        tlsVersion,
        tlsCipher,
        outcome,
        error,
      });
    });
  });
}

/**
 * Performs a family-enforced HTTP request to measure application-layer outcomes.
 */
export function measureHttpRequest({ url, ip, family, isTls, host, timeoutMs = 4000 }) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const parsed = new URL(url);
    const client = isTls ? https : http;

    const reqOptions = {
      hostname: ip, // Explicitly connect to the target IP
      port: parsed.port || (isTls ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: 'GET',
      family,
      headers: {
        Host: host,
        'User-Agent': 'NetScope-IPv6-Auditor/1.0',
        Accept: '*/*',
        Connection: 'close',
      },
      rejectUnauthorized: false,
      timeout: timeoutMs,
    };

    const req = client.request(reqOptions, (res) => {
      const httpDurationMs = Date.now() - startTime;
      const httpStatusCode = res.statusCode;
      const httpStatusText = res.statusMessage || `HTTP ${res.statusCode}`;

      // Consume data stream to free socket
      res.resume();

      let outcome = 'Passed';
      let error = null;

      if (httpStatusCode >= 500) {
        outcome = 'HTTP error';
        error = `Server responded with HTTP ${httpStatusCode}`;
      } else if (httpStatusCode >= 400) {
        // 4xx status is still valid transport layer response
        outcome = 'Passed';
      }

      resolve({
        httpStatusCode,
        httpStatusText,
        httpDurationMs,
        outcome,
        error,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        httpStatusCode: 0,
        httpStatusText: 'Timeout',
        httpDurationMs: Date.now() - startTime,
        outcome: 'Timeout',
        error: 'HTTP request timed out',
      });
    });

    req.on('error', (err) => {
      req.destroy();
      resolve({
        httpStatusCode: 0,
        httpStatusText: err.code || 'Request Error',
        httpDurationMs: Date.now() - startTime,
        outcome: err.code === 'ETIMEDOUT' ? 'Timeout' : 'HTTP error',
        error: err.message,
      });
    });

    req.end();
  });
}

/**
 * Scientific classification and root cause analysis of IPv4 and IPv6 measurements.
 */
export function classifyMeasurement({ dnsResult, ipv4Result, ipv6Result, workerCapabilities }) {
  let overall = 'Inconclusive';
  let isIpv6SpecificFailure = false;
  let explanation = '';
  let recommendedNextStep = '';

  const v4Passed = ipv4Result.tested && ipv4Result.outcome === 'Passed';
  const v6Passed = ipv6Result.tested && ipv6Result.outcome === 'Passed';

  // Check worker capability limitation first
  if (!workerCapabilities.hasNativeIpv6) {
    if (ipv6Result.outcome === 'Unsupported') {
      overall = v4Passed ? 'Passed' : ipv4Result.outcome;
      explanation = 'IPv6 measurement could not be completed because the local worker lacks native IPv6 connectivity or default route. IPv4 transport was verified.';
      recommendedNextStep = 'Deploy NetScope agent to an IPv6-enabled worker node or dual-stack cloud instance to measure IPv6 transport.';
      return {
        overall,
        ipv4Classification: ipv4Result.outcome,
        ipv6Classification: 'Unsupported',
        isIpv6SpecificFailure: false,
        explanation,
        recommendedNextStep,
      };
    }
  }

  // Dual-Stack Success
  if (v4Passed && v6Passed) {
    overall = 'Passed';
    explanation = 'Resource is fully IPv6 ready. Both IPv4 and IPv6 DNS records exist, and TCP handshakes, TLS negotiation, and HTTP responses completed successfully.';
    recommendedNextStep = 'Maintain dual-stack monitoring and ensure DNS TTLs remain balanced.';
    return {
      overall,
      ipv4Classification: 'Passed',
      ipv6Classification: 'Passed',
      isIpv6SpecificFailure: false,
      explanation,
      recommendedNextStep,
    };
  }

  // IPv6 Specific Failures
  if (v4Passed && !v6Passed) {
    isIpv6SpecificFailure = true;

    if (dnsResult.outcome === 'NO_AAAA') {
      overall = 'DNS failure';
      explanation = 'Resource is IPv4-only. Host has valid A records but lacks an AAAA record, blocking all IPv6 clients from resolving the address.';
      recommendedNextStep = 'Provision an IPv6 address for the host or CDN distribution and publish an AAAA record in authoritative DNS.';
    } else if (ipv6Result.outcome === 'TCP failure') {
      overall = 'TCP failure';
      explanation = `Host advertises an AAAA record (${ipv6Result.destinationIp}), but TCP connection on port was refused or reset. IPv4 connected successfully.`;
      recommendedNextStep = 'Check IPv6 ingress firewall rules, security groups, and web server listen directives to ensure port binding on [::].';
    } else if (ipv6Result.outcome === 'TLS failure') {
      overall = 'TLS failure';
      explanation = `Host has valid AAAA and accepts TCP, but TLS handshake failed over IPv6 (${ipv6Result.error}). IPv4 TLS succeeded.`;
      recommendedNextStep = 'Verify SNI configuration and ensure SSL/TLS certificates are properly bound to the IPv6 virtual host.';
    } else if (ipv6Result.outcome === 'Timeout') {
      overall = 'Timeout';
      explanation = `IPv6 connection or request timed out after ${ipv6Result.tcpDurationMs || 0}ms. This frequently indicates an IPv6 black hole (dropped SYN packets).`;
      recommendedNextStep = 'Inspect upstream routing, intermediate stateful firewalls, and PMTU discovery (ICMPv6 Packet Too Big).';
    } else if (ipv6Result.outcome === 'HTTP error') {
      overall = 'HTTP error';
      explanation = `IPv6 transport connected, but application server returned an error (${ipv6Result.error}).`;
      recommendedNextStep = 'Inspect web server application logs for IPv6 client IP parsing or geolocation issues.';
    } else {
      overall = ipv6Result.outcome;
      explanation = `IPv6 failed with ${ipv6Result.outcome}: ${ipv6Result.error || 'Unknown error'}. IPv4 succeeded.`;
      recommendedNextStep = 'Investigate host IPv6 network stack configuration.';
    }

    return {
      overall,
      ipv4Classification: 'Passed',
      ipv6Classification: ipv6Result.outcome,
      isIpv6SpecificFailure,
      explanation,
      recommendedNextStep,
    };
  }

  // IPv4 failed or both failed
  if (!v4Passed && v6Passed) {
    overall = 'Passed';
    explanation = 'Resource is accessible over IPv6, but failed over IPv4. Host is IPv6-dominant or experiencing IPv4 transport issues.';
    recommendedNextStep = 'Check IPv4 connectivity and routing.';
    return {
      overall,
      ipv4Classification: ipv4Result.outcome,
      ipv6Classification: 'Passed',
      isIpv6SpecificFailure: false,
      explanation,
      recommendedNextStep,
    };
  }

  // Both failed
  if (dnsResult.outcome === 'NXDOMAIN') {
    overall = 'DNS failure';
    explanation = 'Host could not be resolved in DNS (neither A nor AAAA records exist).';
    recommendedNextStep = 'Verify domain registration and authoritative nameserver delegations.';
  } else if (ipv4Result.outcome === 'TCP failure' && ipv6Result.outcome === 'TCP failure') {
    overall = 'TCP failure';
    explanation = 'TCP connection failed on both IPv4 and IPv6. Host appears unreachable or the service is down.';
    recommendedNextStep = 'Check service health and network connectivity.';
  } else {
    overall = ipv6Result.outcome !== 'Untested' ? ipv6Result.outcome : ipv4Result.outcome;
    explanation = `Both address families failed. Primary error: ${ipv6Result.error || ipv4Result.error || 'General failure'}.`;
    recommendedNextStep = 'Verify overall server and network availability.';
  }

  return {
    overall,
    ipv4Classification: ipv4Result.outcome,
    ipv6Classification: ipv6Result.outcome,
    isIpv6SpecificFailure: false,
    explanation,
    recommendedNextStep,
  };
}

/**
 * Executes the full measurement pipeline for a single discovered resource.
 */
export async function measureResource({ resource, auditOptions, workerCapabilities }) {
  const parsed = new URL(resource.url);
  const hostname = parsed.hostname;
  const isTls = parsed.protocol === 'https:';
  const port = resource.port || (isTls ? 443 : 80);
  const timeoutMs = auditOptions?.timeoutMs || 4000;

  // 1. DNS Resolution
  const dnsEvidence = await resolveHostDns(hostname);

  // 2. IPv4 Measurements
  let ipv4Evidence = {
    tested: false,
    destinationIp: null,
    tcpConnected: false,
    tcpDurationMs: 0,
    tlsHandshake: false,
    tlsDurationMs: 0,
    tlsVersion: null,
    tlsCipher: null,
    httpStatusCode: null,
    httpStatusText: null,
    httpDurationMs: 0,
    outcome: 'Untested',
    error: null,
  };

  if (dnsEvidence.aRecords.length > 0) {
    const v4Ip = dnsEvidence.aRecords[0];
    const transportResult = await measureTransport({
      ip: v4Ip,
      port,
      host: hostname,
      isTls,
      family: 4,
      timeoutMs,
    });

    let httpResult = null;
    if (transportResult.tcpConnected) {
      httpResult = await measureHttpRequest({
        url: resource.url,
        ip: v4Ip,
        family: 4,
        isTls,
        host: hostname,
        timeoutMs,
      });
    }

    ipv4Evidence = {
      ...transportResult,
      httpStatusCode: httpResult ? httpResult.httpStatusCode : null,
      httpStatusText: httpResult ? httpResult.httpStatusText : null,
      httpDurationMs: httpResult ? httpResult.httpDurationMs : 0,
      outcome: transportResult.outcome !== 'Passed' ? transportResult.outcome : (httpResult ? httpResult.outcome : 'Passed'),
      error: transportResult.error || (httpResult ? httpResult.error : null),
    };
  } else {
    ipv4Evidence.outcome = 'DNS failure';
    ipv4Evidence.error = 'No A record available';
  }

  // 3. IPv6 Measurements
  let ipv6Evidence = {
    tested: false,
    destinationIp: null,
    tcpConnected: false,
    tcpDurationMs: 0,
    tlsHandshake: false,
    tlsDurationMs: 0,
    tlsVersion: null,
    tlsCipher: null,
    httpStatusCode: null,
    httpStatusText: null,
    httpDurationMs: 0,
    outcome: 'Untested',
    error: null,
  };

  if (!workerCapabilities.hasNativeIpv6) {
    ipv6Evidence.tested = false;
    ipv6Evidence.outcome = 'Unsupported';
    ipv6Evidence.error = 'Worker node lacks native IPv6 connectivity or route';
  } else if (dnsEvidence.aaaaRecords.length === 0) {
    ipv6Evidence.tested = true;
    ipv6Evidence.outcome = 'DNS failure';
    ipv6Evidence.error = 'No AAAA record published for host';
  } else {
    const v6Ip = dnsEvidence.aaaaRecords[0];
    const transportResult = await measureTransport({
      ip: v6Ip,
      port,
      host: hostname,
      isTls,
      family: 6,
      timeoutMs,
    });

    let httpResult = null;
    if (transportResult.tcpConnected) {
      httpResult = await measureHttpRequest({
        url: resource.url,
        ip: v6Ip,
        family: 6,
        isTls,
        host: hostname,
        timeoutMs,
      });
    }

    ipv6Evidence = {
      ...transportResult,
      httpStatusCode: httpResult ? httpResult.httpStatusCode : null,
      httpStatusText: httpResult ? httpResult.httpStatusText : null,
      httpDurationMs: httpResult ? httpResult.httpDurationMs : 0,
      outcome: transportResult.outcome !== 'Passed' ? transportResult.outcome : (httpResult ? httpResult.outcome : 'Passed'),
      error: transportResult.error || (httpResult ? httpResult.error : null),
    };
  }

  // 4. Unified Scientific Classification
  const classification = classifyMeasurement({
    dnsResult: dnsEvidence,
    ipv4Result: ipv4Evidence,
    ipv6Result: ipv6Evidence,
    workerCapabilities,
  });

  // 5. Geolocation and Autonomous System (ASN) Measurement Context
  const targetIp = ipv6Evidence.destinationIp || ipv4Evidence.destinationIp;
  const geoContext = await getIpGeoContext(targetIp);

  return {
    url: resource.url,
    hostname,
    port,
    protocol: parsed.protocol,
    dns: dnsEvidence,
    ipv4: ipv4Evidence,
    ipv6: ipv6Evidence,
    geoContext,
    classification,
  };
}
