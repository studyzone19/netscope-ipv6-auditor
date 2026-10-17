import mongoose from 'mongoose';
import { runFullAuditPipeline } from '../src/services/pipeline.js';

async function testGithubAudit() {
  await mongoose.connect('mongodb://127.0.0.1:27017/netscope_ipv6_auditor');
  console.log('[Test] Running full audit on https://github.com...');
  const result = await runFullAuditPipeline('https://github.com', {
    timeoutMs: 15000,
    maxResources: 15,
  });

  const { audit, resources, measurements } = result;
  console.log('[Test] Audit Completed!');
  console.log(' - Target Host:', audit.targetHost);
  console.log(' - Discovered:', audit.summary.totalDiscovered);
  console.log(' - Tested:', audit.summary.totalTested);
  console.log(' - IPv6 Reachable Count:', audit.summary.ipv6ReachableCount);
  console.log(' - IPv6 Reachability Rate:', audit.summary.ipv6ReachabilityRate + '%');
  console.log(' - Confirmed IPv6-Specific Failures:', audit.summary.confirmedIpv6SpecificFailures);

  console.log('\n[Sample Classifications]:');
  for (const m of measurements.slice(0, 5)) {
    console.log(` - ${m.hostname} (${m.url.slice(0, 40)}...): IPv4=${m.ipv4.outcome}, IPv6=${m.ipv6.outcome}, Overall=${m.classification.overall}, Fail=${m.classification.isIpv6SpecificFailure}`);
  }

  await mongoose.disconnect();
}

testGithubAudit().catch((e) => {
  console.error('[Test Failed]:', e);
  process.exit(1);
});
