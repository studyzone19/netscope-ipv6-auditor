import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

import healthRouter from './routes/health.js';
import auditRouter from './routes/audits.js';
import benchmarkRouter from './routes/benchmark.js';
import labRouter from './routes/lab.js';
import reportRouter from './routes/reports.js';
import { startLabServer } from '../../controlled-lab/server.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const LAB_PORT = process.env.LAB_PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/netscope_ipv6_auditor';

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Mount API routes
app.use('/api', healthRouter);
app.use('/api/audits', auditRouter);
app.use('/api/benchmark', benchmarkRouter);
app.use('/api/lab', labRouter);
app.use('/api/reports', reportRouter);

// Serve compiled frontend in production / standalone deployment
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Root informational endpoint fallback
  app.get('/', (req, res) => {
    res.json({
      name: 'NetScope IPv6 Auditor API',
      tagline: 'Beyond DNS. Measure Every Dependency. Prove IPv6 Readiness.',
      version: '1.0.0',
      documentation: '/api/health',
    });
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// MongoDB Connection & Server Launch
let serverInstance = null;
let labServerInstance = null;

export async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to ${MONGODB_URI}`);

    // Start embedded Controlled Lab server
    try {
      labServerInstance = await startLabServer(LAB_PORT);
      console.log(`[Controlled Lab] Listening on http://127.0.0.1:${LAB_PORT}`);
    } catch (labErr) {
      console.warn(`[Controlled Lab] Warning: Could not start on port ${LAB_PORT}:`, labErr.message);
    }

    serverInstance = app.listen(PORT, () => {
      console.log(`[NetScope API] Server running on http://127.0.0.1:${PORT}`);
    });

    return { app, server: serverInstance };
  } catch (err) {
    console.error('[Startup Error]:', err.message);
    process.exit(1);
  }
}

// Auto-run if executed directly
if (process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server'))) {
  startServer();
}

export default app;
