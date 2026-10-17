import { getOrCreateBenchmark, startBenchmarkRun } from '../services/benchmark.js';
import { BenchmarkRun } from '../models/BenchmarkRun.js';

export async function getBenchmark(req, res) {
  try {
    const run = await getOrCreateBenchmark();
    return res.json({ benchmark: run });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function runBenchmark(req, res) {
  try {
    const { concurrency = 2, maxSites = 30 } = req.body || {};
    const result = await startBenchmarkRun({ concurrency, maxSites });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function cancelBenchmark(req, res) {
  try {
    const run = await BenchmarkRun.findOne({ runId: 'global_30_site_benchmark' });
    if (run && run.status === 'running') {
      run.status = 'cancelled';
      await run.save();
    }
    return res.json({ message: 'Benchmark cancelled', run });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
