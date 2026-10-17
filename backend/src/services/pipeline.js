import { Audit } from '../models/Audit.js';
import { Resource } from '../models/Resource.js';
import { Measurement } from '../models/Measurement.js';
import { validateTargetUrl } from './security.js';
import { discoverResources } from './discovery.js';
import { probeWorkerCapabilities, measureResource } from './measurement.js';

/**
 * Runs the end-to-end audit pipeline with 7 distinct observable stages.
 */
export async function runFullAuditPipeline(targetUrl, options = {}) {
  const timeoutMs = options.timeoutMs || 15000;
  const maxResources = options.maxResources || 40;
  const allowLab = options.allowLab || false;

  // 1. Stage: URL validation
  const validation = await validateTargetUrl(targetUrl, { allowLab });
  if (!validation.isValid) {
    throw new Error(`Validation Error: ${validation.error}`);
  }

  const parsedUrl = validation.parsedUrl;
  const targetHost = parsedUrl.hostname;
  const protocol = parsedUrl.protocol;

  // Worker capabilities probe
  const workerCapabilities = await probeWorkerCapabilities();

  // Create Audit document
  const audit = await Audit.create({
    url: parsedUrl.toString(),
    targetHost,
    protocol,
    status: 'validating',
    stage: '1/7: Validating Target URL & Pre-flight DNS',
    progress: 10,
    options: {
      timeoutMs,
      maxResources,
      bypassLabCheck: allowLab,
    },
    workerMetadata: {
      hostname: workerCapabilities.hostname,
      platform: workerCapabilities.platform,
      hasNativeIpv6: workerCapabilities.hasNativeIpv6,
      workerIpv6Addresses: workerCapabilities.workerIpv6Addresses,
      dnsResolvers: workerCapabilities.dnsResolvers,
      timestamp: new Date(),
    },
  });

  try {
    // 2. Stage: Browser Discovery
    audit.status = 'discovering';
    audit.stage = '2/7: Real Browser Discovery via Playwright';
    audit.progress = 25;
    await audit.save();

    const discoveryResult = await discoverResources(parsedUrl.toString(), {
      timeoutMs,
      maxResources,
    });

    const discoveredItems = discoveryResult.resources;

    // 3. Stage: Dependency Extraction
    audit.status = 'extracting';
    audit.stage = '3/7: Dependency Relationship Extraction & Storage';
    audit.progress = 40;
    await audit.save();

    // Store discovered resources in database
    const resourceDocs = [];
    for (const item of discoveredItems) {
      const doc = await Resource.create({
        auditId: audit._id,
        url: item.url,
        hostname: item.hostname,
        pathname: item.pathname,
        protocol: item.protocol,
        port: item.port,
        resourceType: item.resourceType,
        method: item.method,
        browserStatusCode: item.browserStatusCode,
        browserStatusText: item.browserStatusText,
        initiator: item.initiator,
        parentUrl: item.parentUrl,
        isThirdParty: item.isThirdParty,
        timing: item.timing,
        discoveredAt: item.discoveredAt,
      });
      resourceDocs.push(doc);
    }

    // 4 & 5. Stages: IPv4 and IPv6 Measurements
    audit.status = 'measuring_ipv4';
    audit.stage = '4/7: Measuring IPv4 Transport (A records, TCP, TLS, HTTP)';
    audit.progress = 55;
    await audit.save();

    // Measure resources concurrently with batching limit
    const measurements = [];
    const BATCH_SIZE = 4;

    for (let i = 0; i < resourceDocs.length; i += BATCH_SIZE) {
      const batch = resourceDocs.slice(i, i + BATCH_SIZE);

      if (i > resourceDocs.length / 2 && audit.status !== 'measuring_ipv6') {
        audit.status = 'measuring_ipv6';
        audit.stage = '5/7: Measuring IPv6 Transport (AAAA records, TCP, TLS, HTTP)';
        audit.progress = 75;
        await audit.save();
      }

      const batchResults = await Promise.all(
        batch.map((resDoc) =>
          measureResource({
            resource: resDoc,
            auditOptions: { timeoutMs: 5000 },
            workerCapabilities,
          })
        )
      );

      for (let j = 0; j < batch.length; j++) {
        const resDoc = batch[j];
        const mData = batchResults[j];

        const mDoc = await Measurement.create({
          auditId: audit._id,
          resourceId: resDoc._id,
          url: mData.url,
          hostname: mData.hostname,
          port: mData.port,
          protocol: mData.protocol,
          dns: mData.dns,
          ipv4: mData.ipv4,
          ipv6: mData.ipv6,
          geoContext: mData.geoContext,
          classification: mData.classification,
        });

        measurements.push(mDoc);
      }
    }

    // 6. Stage: Failure Classification & Summary Calculation
    audit.status = 'classifying';
    audit.stage = '6/7: Scientific Classification & Root Cause Analysis';
    audit.progress = 90;
    await audit.save();

    let totalDiscovered = resourceDocs.length;
    let totalTested = measurements.filter((m) => m.ipv4.tested || m.ipv6.tested).length;
    let ipv6ReachableCount = 0;
    let ipv6FailedCount = 0;
    let ipv4ReachableCount = 0;
    let ipv4FailedCount = 0;
    let confirmedIpv6SpecificFailures = 0;

    const failureCategories = new Map();
    const resourceTypeBreakdown = new Map();

    for (const res of resourceDocs) {
      const cur = resourceTypeBreakdown.get(res.resourceType) || 0;
      resourceTypeBreakdown.set(res.resourceType, cur + 1);
    }

    for (const m of measurements) {
      if (m.ipv4.tested) {
        if (m.ipv4.outcome === 'Passed') ipv4ReachableCount++;
        else ipv4FailedCount++;
      }

      if (m.ipv6.tested) {
        if (m.ipv6.outcome === 'Passed') ipv6ReachableCount++;
        else ipv6FailedCount++;
      }

      if (m.classification.isIpv6SpecificFailure) {
        confirmedIpv6SpecificFailures++;
      }

      const cat = m.classification.overall;
      const curCat = failureCategories.get(cat) || 0;
      failureCategories.set(cat, curCat + 1);
    }

    // Calculate reachability excluding untested resources
    const ipv6ReachabilityRate =
      totalTested > 0 ? Math.round((ipv6ReachableCount / totalTested) * 100) : 0;
    const measurementCoverageRate =
      totalDiscovered > 0 ? Math.round((totalTested / totalDiscovered) * 100) : 100;

    audit.summary = {
      totalDiscovered,
      totalTested,
      ipv6ReachableCount,
      ipv6FailedCount,
      ipv4ReachableCount,
      ipv4FailedCount,
      ipv6ReachabilityRate,
      confirmedIpv6SpecificFailures,
      measurementCoverageRate,
      failureCategories,
      resourceTypeBreakdown,
    };

    // 7. Stage: Report Ready & Completed
    audit.status = 'completed';
    audit.stage = '7/7: Report Generated & Ready';
    audit.progress = 100;
    await audit.save();

    return { audit, resources: resourceDocs, measurements };
  } catch (err) {
    audit.status = 'failed';
    audit.stage = 'Audit Failed';
    audit.error = err.message;
    await audit.save();
    throw err;
  }
}
