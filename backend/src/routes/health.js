import express from 'express';
import { probeWorkerCapabilities } from '../services/measurement.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const worker = await probeWorkerCapabilities();
    return res.json({
      status: 'healthy',
      service: 'NetScope IPv6 Auditor API',
      version: '1.1.0-resilient',
      commit: 'latest-main',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      worker: {
        hostname: worker.hostname,
        platform: worker.platform,
        hasNativeIpv6: worker.hasNativeIpv6,
        workerIpv6Addresses: worker.workerIpv6Addresses,
        dnsResolvers: worker.dnsResolvers,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

export default router;
