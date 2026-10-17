import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import mongoose from 'mongoose';

describe('Backend API Integration Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/netscope_ipv6_auditor');
    }
  });

  afterAll(async () => {
    // Keep connection or cleanup
  });

  it('GET /api/health responds with worker status and health data', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('NetScope IPv6 Auditor API');
    expect(res.body.worker).toHaveProperty('hasNativeIpv6');
    expect(res.body.worker).toHaveProperty('hostname');
  });

  it('GET /api/lab/manifest returns the ground-truth test manifest', async () => {
    const res = await request(app).get('/api/lab/manifest');
    expect(res.status).toBe(200);
    expect(res.body.manifest).toHaveProperty('testCases');
    expect(res.body.manifest.testCases.length).toBeGreaterThanOrEqual(6);
  });

  it('POST /api/lab/validate executes lab validation with confusion matrix', async () => {
    const res = await request(app).post('/api/lab/validate');
    expect(res.status).toBe(200);
    expect(res.body.validation).toHaveProperty('summary');
    expect(res.body.validation.summary.accuracy).toBe(100);
    expect(res.body.validation.suiteStatus).toBe('PASSED');
  });

  it('POST /api/audits rejects invalid/private URLs with 400', async () => {
    const res = await request(app)
      .post('/api/audits')
      .send({ url: 'http://127.0.0.1:8080' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/restricted|SSRF/i);
  });

  it('GET /api/benchmark returns 30 configured sites', async () => {
    const res = await request(app).get('/api/benchmark');
    expect(res.status).toBe(200);
    expect(res.body.benchmark.sites.length).toBe(30);
  });
});
