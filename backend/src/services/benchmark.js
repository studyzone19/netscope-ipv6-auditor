import { BenchmarkRun } from '../models/BenchmarkRun.js';
import { Audit } from '../models/Audit.js';
import { runFullAuditPipeline } from './pipeline.js';

export const BENCHMARK_SITES = [
  // Search & Cloud
  { name: 'Google', url: 'https://www.google.com', category: 'Search & Cloud' },
  { name: 'Cloudflare', url: 'https://www.cloudflare.com', category: 'Search & Cloud' },
  { name: 'Microsoft', url: 'https://www.microsoft.com', category: 'Search & Cloud' },
  { name: 'AWS', url: 'https://aws.amazon.com', category: 'Search & Cloud' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', category: 'Search & Cloud' },
  { name: 'Fastly', url: 'https://www.fastly.com', category: 'Search & Cloud' },

  // Tech & Developer
  { name: 'GitHub', url: 'https://github.com', category: 'Tech & Developer' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'Tech & Developer' },
  { name: 'Python Software Foundation', url: 'https://www.python.org', category: 'Tech & Developer' },
  { name: 'Mozilla', url: 'https://www.mozilla.org', category: 'Tech & Developer' },
  { name: 'NPM Registry', url: 'https://www.npmjs.com', category: 'Tech & Developer' },
  { name: 'Docker', url: 'https://www.docker.com', category: 'Tech & Developer' },

  // Media & News
  { name: 'BBC News', url: 'https://www.bbc.com', category: 'Media & News' },
  { name: 'CNN', url: 'https://www.cnn.com', category: 'Media & News' },
  { name: 'The New York Times', url: 'https://www.nytimes.com', category: 'Media & News' },
  { name: 'The Guardian', url: 'https://www.theguardian.com', category: 'Media & News' },
  { name: 'Reuters', url: 'https://www.reuters.com', category: 'Media & News' },
  { name: 'Reddit', url: 'https://www.reddit.com', category: 'Media & News' },

  // E-commerce & Retail
  { name: 'Amazon', url: 'https://www.amazon.com', category: 'E-commerce & Retail' },
  { name: 'eBay', url: 'https://www.ebay.com', category: 'E-commerce & Retail' },
  { name: 'Apple', url: 'https://www.apple.com', category: 'E-commerce & Retail' },
  { name: 'Walmart', url: 'https://www.walmart.com', category: 'E-commerce & Retail' },
  { name: 'Shopify', url: 'https://www.shopify.com', category: 'E-commerce & Retail' },
  { name: 'Etsy', url: 'https://www.etsy.com', category: 'E-commerce & Retail' },

  // Government & Education
  { name: 'NIST', url: 'https://www.nist.gov', category: 'Government & Education' },
  { name: 'NASA', url: 'https://www.nasa.gov', category: 'Government & Education' },
  { name: 'MIT', url: 'https://www.mit.edu', category: 'Government & Education' },
  { name: 'Stanford University', url: 'https://www.stanford.edu', category: 'Government & Education' },
  { name: 'CERN', url: 'https://home.cern', category: 'Government & Education' },
  { name: 'W3C', url: 'https://www.w3.org', category: 'Government & Education' },
];

let activeBenchmarkJob = null;

/**
 * Gets or initializes the singleton benchmark state in the database.
 */
export async function getOrCreateBenchmark() {
  let run = await BenchmarkRun.findOne({ runId: 'global_30_site_benchmark' });
  if (!run) {
    run = await BenchmarkRun.create({
      runId: 'global_30_site_benchmark',
      status: 'idle',
      totalSites: BENCHMARK_SITES.length,
      completedSites: 0,
      failedSites: 0,
      overallIpv6Reachability: 0,
      sites: BENCHMARK_SITES.map((s) => ({
        name: s.name,
        url: s.url,
        category: s.category,
        status: 'pending',
      })),
    });
  }
  return run;
}

/**
 * Runs the benchmark in batches with concurrency limits.
 */
export async function startBenchmarkRun({ concurrency = 2, maxSites = 30 } = {}) {
  let run = await getOrCreateBenchmark();

  if (run.status === 'running') {
    return { message: 'Benchmark is already running', run };
  }

  run.status = 'running';
  run.startedAt = new Date();
  await run.save();

  // Run in background asynchronously without blocking the API response
  (async () => {
    try {
      const sitesToRun = run.sites.slice(0, maxSites);

      for (let i = 0; i < sitesToRun.length; i += concurrency) {
        // Check if benchmark was cancelled
        const currentCheck = await BenchmarkRun.findOne({ runId: 'global_30_site_benchmark' });
        if (currentCheck && currentCheck.status === 'cancelled') {
          break;
        }

        const chunk = sitesToRun.slice(i, i + concurrency);

        await Promise.allSettled(
          chunk.map(async (siteItem) => {
            try {
              // Update status to running
              await BenchmarkRun.updateOne(
                { runId: 'global_30_site_benchmark', 'sites.url': siteItem.url },
                { $set: { 'sites.$.status': 'running' } }
              );

              const startTime = Date.now();
              const result = await runFullAuditPipeline(siteItem.url, {
                timeoutMs: 12000,
                maxResources: 25,
              });

              const durationMs = Date.now() - startTime;
              const summary = result.audit.summary;

              const isRootAaaa = summary.resourceTypeBreakdown.get('document') > 0;
              const reachableRate = summary.ipv6ReachabilityRate || 0;

              await BenchmarkRun.updateOne(
                { runId: 'global_30_site_benchmark', 'sites.url': siteItem.url },
                {
                  $set: {
                    'sites.$.status': 'completed',
                    'sites.$.auditId': result.audit._id,
                    'sites.$.totalResources': summary.totalDiscovered,
                    'sites.$.ipv6ReachableCount': summary.ipv6ReachableCount,
                    'sites.$.ipv6SuccessRate': reachableRate,
                    'sites.$.rootHasAaaa': summary.ipv6ReachableCount > 0,
                    'sites.$.rootIpv6Reachable': summary.ipv6ReachableCount > 0,
                    'sites.$.brokenDependenciesCount': summary.confirmedIpv6SpecificFailures,
                    'sites.$.durationMs': durationMs,
                    'sites.$.error': null,
                  },
                }
              );
            } catch (err) {
              await BenchmarkRun.updateOne(
                { runId: 'global_30_site_benchmark', 'sites.url': siteItem.url },
                {
                  $set: {
                    'sites.$.status': 'failed',
                    'sites.$.error': err.message,
                  },
                }
              );
            }
          })
        );

        // Update overall stats after each chunk
        const updatedRun = await BenchmarkRun.findOne({ runId: 'global_30_site_benchmark' });
        if (updatedRun) {
          const completed = updatedRun.sites.filter((s) => s.status === 'completed');
          const failed = updatedRun.sites.filter((s) => s.status === 'failed');

          let totalRate = 0;
          let totalRes = 0;
          for (const s of completed) {
            totalRate += s.ipv6SuccessRate;
            totalRes += s.totalResources;
          }

          updatedRun.completedSites = completed.length;
          updatedRun.failedSites = failed.length;
          updatedRun.overallIpv6Reachability =
            completed.length > 0 ? Math.round(totalRate / completed.length) : 0;
          updatedRun.averageResourceCount =
            completed.length > 0 ? Math.round(totalRes / completed.length) : 0;
          await updatedRun.save();
        }
      }

      // Mark completed
      const finalRun = await BenchmarkRun.findOne({ runId: 'global_30_site_benchmark' });
      if (finalRun && finalRun.status === 'running') {
        finalRun.status = 'completed';
        finalRun.completedAt = new Date();
        await finalRun.save();
      }
    } catch (globalErr) {
      console.error('Benchmark execution error:', globalErr);
      await BenchmarkRun.updateOne(
        { runId: 'global_30_site_benchmark' },
        { $set: { status: 'failed' } }
      );
    }
  })();

  return { message: 'Benchmark started', run };
}
