import mongoose from 'mongoose';
import { runFullAuditPipeline } from '../src/services/pipeline.js';
import { generateJsonReport, generateCsvReport } from '../src/services/reports.js';
import { buildDependencyGraph } from '../src/services/graph.js';
import { Resource } from '../src/models/Resource.js';
import { Measurement } from '../src/models/Measurement.js';

async function testPipeline() {
  console.log('[E2E Test] Connecting to MongoDB...');
  await mongoose.connect('mongodb://127.0.0.1:27017/netscope_ipv6_auditor');
  console.log('[E2E Test] Connected.');

  console.log('[E2E Test] Running audit on https://www.google.com (max 10 resources)...');
  const result = await runFullAuditPipeline('https://www.google.com', {
    timeoutMs: 15000,
    maxResources: 10,
  });

  const { audit, resources, measurements } = result;

  console.log('[E2E Test] Audit Completed!');
  console.log(' - Target Host:', audit.targetHost);
  console.log(' - Status:', audit.status);
  console.log(' - Discovered:', audit.summary.totalDiscovered);
  console.log(' - Tested:', audit.summary.totalTested);
  console.log(' - IPv6 Reachable Count:', audit.summary.ipv6ReachableCount);
  console.log(' - IPv6 Reachability Rate:', audit.summary.ipv6ReachabilityRate + '%');
  console.log(' - Coverage:', audit.summary.measurementCoverageRate + '%');
  console.log(' - Confirmed IPv6 Failures:', audit.summary.confirmedIpv6SpecificFailures);

  console.log('[E2E Test] Testing Graph builder...');
  const graph = buildDependencyGraph(audit, resources, measurements);
  console.log(` - Built graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`);

  console.log('[E2E Test] Testing JSON & CSV Report export...');
  const jsonReport = await generateJsonReport(audit._id);
  const csvReport = await generateCsvReport(audit._id);
  console.log(` - JSON report generated with ${jsonReport.resources.length} resources.`);
  console.log(` - CSV report generated (${csvReport.split('\n').length} lines).`);

  await mongoose.disconnect();
  console.log('[E2E Test] Test complete successfully!');
}

testPipeline().catch((err) => {
  console.error('[E2E Test Failed]:', err);
  process.exit(1);
});
