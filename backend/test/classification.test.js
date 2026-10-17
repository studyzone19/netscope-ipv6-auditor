import { describe, it, expect } from 'vitest';
import { classifyMeasurement } from '../src/services/measurement.js';

describe('Scientific Failure Classification Engine', () => {
  const workerWithIpv6 = { hasNativeIpv6: true };
  const workerWithoutIpv6 = { hasNativeIpv6: false };

  it('classifies healthy dual-stack as Passed with no IPv6-specific failure', () => {
    const dns = { outcome: 'SUCCESS' };
    const ipv4 = { tested: true, outcome: 'Passed' };
    const ipv6 = { tested: true, outcome: 'Passed' };

    const result = classifyMeasurement({
      dnsResult: dns,
      ipv4Result: ipv4,
      ipv6Result: ipv6,
      workerCapabilities: workerWithIpv6,
    });

    expect(result.overall).toBe('Passed');
    expect(result.isIpv6SpecificFailure).toBe(false);
    expect(result.explanation).toContain('fully IPv6 ready');
  });

  it('classifies missing AAAA record as IPv6 DNS failure when IPv4 passes', () => {
    const dns = { outcome: 'NO_AAAA' };
    const ipv4 = { tested: true, outcome: 'Passed' };
    const ipv6 = { tested: true, outcome: 'DNS failure', error: 'No AAAA record published' };

    const result = classifyMeasurement({
      dnsResult: dns,
      ipv4Result: ipv4,
      ipv6Result: ipv6,
      workerCapabilities: workerWithIpv6,
    });

    expect(result.overall).toBe('DNS failure');
    expect(result.isIpv6SpecificFailure).toBe(true);
    expect(result.recommendedNextStep).toContain('publish an AAAA record');
  });

  it('classifies IPv6 TCP reset as TCP failure when IPv4 passes', () => {
    const dns = { outcome: 'SUCCESS' };
    const ipv4 = { tested: true, outcome: 'Passed' };
    const ipv6 = { tested: true, outcome: 'TCP failure', destinationIp: '2001:db8::1', error: 'ECONNREFUSED' };

    const result = classifyMeasurement({
      dnsResult: dns,
      ipv4Result: ipv4,
      ipv6Result: ipv6,
      workerCapabilities: workerWithIpv6,
    });

    expect(result.overall).toBe('TCP failure');
    expect(result.isIpv6SpecificFailure).toBe(true);
    expect(result.recommendedNextStep).toContain('Check IPv6 ingress firewall');
  });

  it('classifies IPv6 TLS handshake failure as TLS failure', () => {
    const dns = { outcome: 'SUCCESS' };
    const ipv4 = { tested: true, outcome: 'Passed' };
    const ipv6 = { tested: true, outcome: 'TLS failure', error: 'CERT_HAS_EXPIRED' };

    const result = classifyMeasurement({
      dnsResult: dns,
      ipv4Result: ipv4,
      ipv6Result: ipv6,
      workerCapabilities: workerWithIpv6,
    });

    expect(result.overall).toBe('TLS failure');
    expect(result.isIpv6SpecificFailure).toBe(true);
    expect(result.recommendedNextStep).toContain('SSL/TLS certificates');
  });

  it('classifies IPv6 timeout as Timeout and warns of potential black hole', () => {
    const dns = { outcome: 'SUCCESS' };
    const ipv4 = { tested: true, outcome: 'Passed' };
    const ipv6 = { tested: true, outcome: 'Timeout', tcpDurationMs: 4000 };

    const result = classifyMeasurement({
      dnsResult: dns,
      ipv4Result: ipv4,
      ipv6Result: ipv6,
      workerCapabilities: workerWithIpv6,
    });

    expect(result.overall).toBe('Timeout');
    expect(result.isIpv6SpecificFailure).toBe(true);
    expect(result.explanation).toContain('black hole');
  });

  it('honestly marks IPv6 as Unsupported when the worker node lacks IPv6 connectivity', () => {
    const dns = { outcome: 'SUCCESS' };
    const ipv4 = { tested: true, outcome: 'Passed' };
    const ipv6 = { tested: false, outcome: 'Unsupported' };

    const result = classifyMeasurement({
      dnsResult: dns,
      ipv4Result: ipv4,
      ipv6Result: ipv6,
      workerCapabilities: workerWithoutIpv6,
    });

    expect(result.ipv6Classification).toBe('Unsupported');
    expect(result.isIpv6SpecificFailure).toBe(false);
    expect(result.explanation).toContain('worker lacks native IPv6 connectivity');
  });
});
