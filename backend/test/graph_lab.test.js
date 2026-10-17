import { describe, it, expect } from 'vitest';
import { buildDependencyGraph } from '../src/services/graph.js';
import { getLabManifest, validateControlledLab } from '../src/services/lab.js';

describe('Dependency Graph Service', () => {
  it('builds valid React Flow nodes and edges from discovered resources', () => {
    const mockAudit = {
      _id: 'audit-123',
      url: 'https://example.com',
      targetHost: 'example.com',
    };

    const mockResources = [
      {
        url: 'https://example.com',
        hostname: 'example.com',
        pathname: '/',
        resourceType: 'document',
        isThirdParty: false,
      },
      {
        url: 'https://cdn.example.com/bundle.js',
        hostname: 'cdn.example.com',
        pathname: '/bundle.js',
        resourceType: 'script',
        isThirdParty: true,
        parentUrl: 'https://example.com',
      },
    ];

    const mockMeasurements = [
      {
        url: 'https://example.com',
        classification: { overall: 'Passed', isIpv6SpecificFailure: false },
        ipv4: { outcome: 'Passed' },
        ipv6: { outcome: 'Passed' },
      },
      {
        url: 'https://cdn.example.com/bundle.js',
        classification: { overall: 'DNS failure', isIpv6SpecificFailure: true },
        ipv4: { outcome: 'Passed' },
        ipv6: { outcome: 'DNS failure' },
      },
    ];

    const graph = buildDependencyGraph(mockAudit, mockResources, mockMeasurements);

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.nodes[0].type).toBe('rootNode');
    expect(graph.nodes[1].data.isIpv6SpecificFailure).toBe(true);
    expect(graph.edges[0].source).toBe('node-root');
  });
});

describe('Controlled Lab Validation Engine', () => {
  it('loads valid manifest with required test cases', () => {
    const manifest = getLabManifest();
    expect(manifest.testCases.length).toBeGreaterThanOrEqual(6);
    expect(manifest.testCases.some((tc) => tc.id === 'TC-01')).toBe(true);
    expect(manifest.testCases.some((tc) => tc.id === 'TC-02')).toBe(true);
  });

  it('runs validation against manifest ground truth and computes confusion matrix', async () => {
    const report = await validateControlledLab();
    expect(report.suiteStatus).toBe('PASSED');
    expect(report.summary.accuracy).toBe(100);
    expect(report.summary.truePositives).toBeGreaterThan(0);
    expect(report.summary.trueNegatives).toBeGreaterThan(0);
    expect(report.summary.falsePositives).toBe(0);
    expect(report.summary.falseNegatives).toBe(0);
  });
});
