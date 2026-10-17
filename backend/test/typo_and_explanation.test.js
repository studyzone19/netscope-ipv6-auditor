import { describe, it, expect } from 'vitest';
import { detectUrlTypo, diagnoseFailureStage } from '../src/services/typoDetector.js';
import {
  generateSmartFindings,
  generateTrustSignals,
  generateEasyNotes,
} from '../src/services/explanationEngine.js';

describe('Smart URL Typo Detection & Error Fix Guide', () => {
  it('detects missing letter in reference URL (prayag-hospitl.vercel.app -> prayag-hospital.vercel.app)', () => {
    const input = 'https://prayag-hospitl.vercel.app/';
    const result = detectUrlTypo(input);

    expect(result.hasMistake).toBe(true);
    expect(result.errorCategory).toBe('HOSTNAME_TYPO');
    expect(result.suggestedUrl).toBe('https://prayag-hospital.vercel.app/');
    expect(result.referenceMatch).toBe('prayag-hospital.vercel.app');
    expect(result.characterPosition).toBeGreaterThan(0);
    expect(result.explanationEn).toContain('closely matches the reference domain');
    expect(result.explanationHi).toContain('typing mistake');
    expect(result.stepByStepFix).toBeInstanceOf(Array);
  });

  it('detects common TLD typos (.cmo -> .com)', () => {
    const input = 'https://example.cmo/about';
    const result = detectUrlTypo(input);

    expect(result.hasMistake).toBe(true);
    expect(result.errorCategory).toBe('TLD_TYPO');
    expect(result.suggestedUrl).toBe('https://example.com/about');
    expect(result.suspectedTypo).toBe('.cmo');
  });

  it('detects double dots in domain name (example..com)', () => {
    const input = 'https://example..com';
    const result = detectUrlTypo(input);

    expect(result.hasMistake).toBe(true);
    expect(result.errorCategory).toBe('PUNCTUATION');
    expect(result.suggestedUrl).toBe('https://example.com/');
    expect(result.suspectedTypo).toBe('..');
  });

  it('detects scheme syntax typo (htp:// -> https://)', () => {
    const input = 'htp://example.com';
    const result = detectUrlTypo(input);

    expect(result.hasMistake).toBe(true);
    expect(result.errorCategory).toBe('SCHEME_TYPO');
    expect(result.suggestedUrl).toBe('https://example.com');
  });

  it('passes cleanly for valid canonical domains', () => {
    const input = 'https://example.com';
    const result = detectUrlTypo(input);

    expect(result.hasMistake).toBe(false);
    expect(result.hostname).toBe('example.com');
  });
});

describe('Smart Website Audit & Easy Explanation Engine', () => {
  const mockAudit = {
    _id: '507f1f77bcf86cd799439011',
    url: 'https://example.com',
    targetHost: 'example.com',
    protocol: 'https:',
    summary: {
      totalDiscovered: 5,
      totalTested: 5,
      ipv6ReachabilityRate: 80,
      measurementCoverageRate: 100,
      confirmedIpv6SpecificFailures: 1,
    },
    workerMetadata: {
      hasNativeIpv6: true,
      hostname: 'test-node-1',
    },
  };

  const mockResources = [
    {
      _id: 'res-root',
      url: 'https://example.com',
      hostname: 'example.com',
      pathname: '/',
      resourceType: 'document',
      protocol: 'https:',
      isThirdParty: false,
    },
    {
      _id: 'res-script',
      url: 'https://cdn.example.org/tracker.js',
      hostname: 'cdn.example.org',
      pathname: '/tracker.js',
      resourceType: 'script',
      protocol: 'https:',
      isThirdParty: true,
    },
  ];

  const mockMeasurements = [
    {
      url: 'https://example.com',
      hostname: 'example.com',
      dns: {
        aRecords: ['93.184.216.34'],
        aaaaRecords: ['2606:2800:220:1:248:1893:25c8:1946'],
        resolverUsed: '8.8.8.8',
        lookupDurationMs: 14,
      },
      ipv4: {
        tested: true,
        destinationIp: '93.184.216.34',
        tcpConnected: true,
        tcpDurationMs: 25,
        tlsHandshake: true,
        outcome: 'Passed',
      },
      ipv6: {
        tested: true,
        destinationIp: '2606:2800:220:1:248:1893:25c8:1946',
        tcpConnected: true,
        tcpDurationMs: 35,
        tlsHandshake: true,
        outcome: 'Passed',
      },
      classification: { overall: 'Passed', isIpv6SpecificFailure: false },
    },
    {
      url: 'https://cdn.example.org/tracker.js',
      hostname: 'cdn.example.org',
      dns: {
        aRecords: ['198.51.100.1'],
        aaaaRecords: [],
      },
      ipv4: { tested: true, outcome: 'Passed', destinationIp: '198.51.100.1' },
      ipv6: { tested: true, outcome: 'DNS failure', error: 'No AAAA record published' },
      classification: {
        overall: 'DNS failure',
        isIpv6SpecificFailure: true,
      },
    },
  ];

  it('generates structured findings with all 17 required fields', () => {
    const findings = generateSmartFindings(mockAudit, mockResources, mockMeasurements);
    expect(findings.length).toBeGreaterThan(0);

    const first = findings[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('status');
    expect(first).toHaveProperty('severity');
    expect(first).toHaveProperty('affectedUrl');
    expect(first).toHaveProperty('category');
    expect(first).toHaveProperty('whatHappened');
    expect(first).toHaveProperty('simpleEnglish');
    expect(first).toHaveProperty('simpleHinglish');
    expect(first).toHaveProperty('whyItMatters');
    expect(first).toHaveProperty('visitorImpact');
    expect(first).toHaveProperty('actualEvidence');
    expect(first).toHaveProperty('likelyCause');
    expect(first).toHaveProperty('stepByStepFix');
    expect(first).toHaveProperty('verificationSteps');
  });

  it('includes both Simple English and Simple Hinglish explanations', () => {
    const findings = generateSmartFindings(mockAudit, mockResources, mockMeasurements);
    for (const f of findings) {
      expect(typeof f.simpleEnglish).toBe('string');
      expect(f.simpleEnglish.length).toBeGreaterThan(5);
      expect(typeof f.simpleHinglish).toBe('string');
      expect(f.simpleHinglish.length).toBeGreaterThan(5);
    }
  });

  it('generates Trust Signals without false accusations', () => {
    const signals = generateTrustSignals(mockAudit, mockResources, mockMeasurements);
    expect(signals).toHaveProperty('overview');
    expect(signals).toHaveProperty('transportSecurity');
    expect(signals).toHaveProperty('domainIntegrity');
    expect(signals).toHaveProperty('suspiciousSignals');
    expect(signals.suspiciousSignals.note.toLowerCase()).toContain('never labeled as a scam or phishing');
  });

  it('generates Easy Notes view and jury presentation cheat-sheet', () => {
    const findings = generateSmartFindings(mockAudit, mockResources, mockMeasurements);
    const notes = generateEasyNotes(mockAudit, findings);

    expect(notes).toHaveProperty('quickVerdict');
    expect(notes).toHaveProperty('notes');
    expect(notes).toHaveProperty('howToExplainToJury');
    expect(notes.howToExplainToJury.length).toBeGreaterThanOrEqual(3);
  });
});
