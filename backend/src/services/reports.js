import { Audit } from '../models/Audit.js';
import { Resource } from '../models/Resource.js';
import { Measurement } from '../models/Measurement.js';
import { generateSmartFindings, generateTrustSignals } from './explanationEngine.js';

/**
 * Escapes a field for safe CSV output according to RFC 4180.
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an exhaustive JSON report matching stored database records.
 */
export async function generateJsonReport(auditId) {
  const audit = await Audit.findById(auditId).lean();
  if (!audit) throw new Error(`Audit ${auditId} not found`);

  const resources = await Resource.find({ auditId }).lean();
  const measurements = await Measurement.find({ auditId }).lean();

  const measurementMap = new Map();
  for (const m of measurements) {
    measurementMap.set(m.url, m);
  }

  const detailedResources = resources.map((res) => {
    const m = measurementMap.get(res.url);
    return {
      resourceId: res._id,
      url: res.url,
      hostname: res.hostname,
      pathname: res.pathname,
      protocol: res.protocol,
      port: res.port,
      resourceType: res.resourceType,
      method: res.method,
      browserStatusCode: res.browserStatusCode,
      isThirdParty: res.isThirdParty,
      parentUrl: res.parentUrl,
      dns: m ? m.dns : null,
      ipv4: m ? m.ipv4 : null,
      ipv6: m ? m.ipv6 : null,
      geoContext: m ? m.geoContext : null,
      classification: m ? m.classification : null,
    };
  });

  return {
    meta: {
      reportType: 'NetScope IPv6 Audit Report',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      methodology: 'RFC 8305 Dual-Stack Measurement & RFC 4291 Addressing Specification',
      referenceInitiative: 'IETF webres6 (https://github.com/SAP/webres6)',
      disclaimer:
        'Measurements reflect network conditions and resources observed during the audited browser session. Tested resources are strictly verified; untested or unsupported states are explicitly documented.',
    },
    audit: {
      id: audit._id,
      url: audit.url,
      targetHost: audit.targetHost,
      protocol: audit.protocol,
      status: audit.status,
      summary: audit.summary,
      workerMetadata: audit.workerMetadata,
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
    },
    summaryStatistics: {
      totalDiscovered: audit.summary?.totalDiscovered || 0,
      totalTested: audit.summary?.totalTested || 0,
      ipv6ReachabilityRate: `${audit.summary?.ipv6ReachabilityRate || 0}%`,
      measurementCoverageRate: `${audit.summary?.measurementCoverageRate || 0}%`,
      confirmedIpv6SpecificFailures: audit.summary?.confirmedIpv6SpecificFailures || 0,
    },
    smartFindings: generateSmartFindings(audit, resources, measurements),
    trustSignals: generateTrustSignals(audit, resources, measurements),
    resources: detailedResources,
  };
}

/**
 * Generates a full RFC 4180 CSV export of all resources and measurements.
 */
export async function generateCsvReport(auditId) {
  const audit = await Audit.findById(auditId).lean();
  if (!audit) throw new Error(`Audit ${auditId} not found`);

  const resources = await Resource.find({ auditId }).lean();
  const measurements = await Measurement.find({ auditId }).lean();

  const measurementMap = new Map();
  for (const m of measurements) {
    measurementMap.set(m.url, m);
  }

  const headers = [
    'Audit ID',
    'Target Host',
    'Resource URL',
    'Resource Type',
    'Is Third Party',
    'Browser Status Code',
    'DNS Query Host',
    'DNS Resolver Used',
    'DNS A Records',
    'DNS AAAA Records',
    'DNS Lookup Duration (ms)',
    'Destination Country',
    'Destination City',
    'Destination ASN',
    'IPv4 Tested',
    'IPv4 Destination IP',
    'IPv4 TCP Connected',
    'IPv4 TCP Duration (ms)',
    'IPv4 TLS Handshake',
    'IPv4 TLS Cipher',
    'IPv4 HTTP Status',
    'IPv4 Outcome',
    'IPv6 Tested',
    'IPv6 Destination IP',
    'IPv6 TCP Connected',
    'IPv6 TCP Duration (ms)',
    'IPv6 TLS Handshake',
    'IPv6 TLS Cipher',
    'IPv6 HTTP Status',
    'IPv6 Outcome',
    'Overall Classification',
    'Is IPv6 Specific Failure',
    'Root Cause Explanation',
    'Recommended Next Step',
  ];

  const rows = [headers.join(',')];

  for (const res of resources) {
    const m = measurementMap.get(res.url) || {};
    const dns = m.dns || {};
    const ipv4 = m.ipv4 || {};
    const ipv6 = m.ipv6 || {};
    const geo = m.geoContext || {};
    const classification = m.classification || {};

    const row = [
      escapeCsv(audit._id),
      escapeCsv(audit.targetHost),
      escapeCsv(res.url),
      escapeCsv(res.resourceType),
      escapeCsv(res.isThirdParty ? 'true' : 'false'),
      escapeCsv(res.browserStatusCode || ''),
      escapeCsv(dns.queryHost || ''),
      escapeCsv(dns.resolverUsed || ''),
      escapeCsv(dns.aRecords ? dns.aRecords.join('; ') : ''),
      escapeCsv(dns.aaaaRecords ? dns.aaaaRecords.join('; ') : ''),
      escapeCsv(dns.lookupDurationMs || ''),
      escapeCsv(geo.country || 'Unknown'),
      escapeCsv(geo.city || 'Edge Node'),
      escapeCsv(geo.asn || 'BGP Routed'),
      escapeCsv(ipv4.tested ? 'true' : 'false'),
      escapeCsv(ipv4.destinationIp || ''),
      escapeCsv(ipv4.tcpConnected ? 'true' : 'false'),
      escapeCsv(ipv4.tcpDurationMs || ''),
      escapeCsv(ipv4.tlsHandshake ? 'true' : 'false'),
      escapeCsv(ipv4.tlsCipher || ''),
      escapeCsv(ipv4.httpStatusCode || ''),
      escapeCsv(ipv4.outcome || 'Untested'),
      escapeCsv(ipv6.tested ? 'true' : 'false'),
      escapeCsv(ipv6.destinationIp || ''),
      escapeCsv(ipv6.tcpConnected ? 'true' : 'false'),
      escapeCsv(ipv6.tcpDurationMs || ''),
      escapeCsv(ipv6.tlsHandshake ? 'true' : 'false'),
      escapeCsv(ipv6.tlsCipher || ''),
      escapeCsv(ipv6.httpStatusCode || ''),
      escapeCsv(ipv6.outcome || 'Untested'),
      escapeCsv(classification.overall || 'Untested'),
      escapeCsv(classification.isIpv6SpecificFailure ? 'true' : 'false'),
      escapeCsv(classification.explanation || ''),
      escapeCsv(classification.recommendedNextStep || ''),
    ];

    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}
