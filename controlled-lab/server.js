import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.LAB_PORT || 5005;

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NetScope IPv6 Auditor - Controlled Test Lab</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <h1>NetScope Controlled Test Lab</h1>
    <p>This laboratory provides deterministic test targets to benchmark network measurement algorithms against known ground truth.</p>
    <div id="results"></div>
  </div>
  <script src="/app.js"></script>
</body>
</html>`;

const CSS_CONTENT = `
body { font-family: system-ui, sans-serif; background: #0b1120; color: #f8fafc; padding: 2rem; }
.container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 8px; border: 1px solid #334155; }
h1 { color: #38bdf8; }
`;

const JS_CONTENT = `
console.log('NetScope Controlled Lab script loaded');
fetch('/api/dual-stack-pass').then(r => r.json()).then(data => {
  const el = document.getElementById('results');
  if (el) el.innerText = 'Dual-stack API response: ' + JSON.stringify(data);
});
`;

export function startLabServer(port = PORT) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = url.pathname;

    // Handle test endpoints
    switch (pathname) {
      case '/':
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(HTML_CONTENT);
        break;

      case '/style.css':
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(CSS_CONTENT);
        break;

      case '/app.js':
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(JS_CONTENT);
        break;

      case '/api/dual-stack-pass':
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ status: 'ok', message: 'Dual-stack functional', timestamp: Date.now() }));
        break;

      case '/api/http-404-error':
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: 'Not Found', message: 'Transport succeeded, application returned 404' }));
        break;

      case '/api/http-500-error':
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: 'Internal Server Error', message: 'Simulated 500 error' }));
        break;

      case '/api/cors-restricted':
        // Intentionally omit Access-Control-Allow-Origin to simulate CORS block
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Valid transport, but browser CORS will block cross-origin JS' }));
        break;

      case '/api/ipv4-only-sim':
        // Simulates an endpoint with A record only
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'X-NetScope-Simulated-Stack': 'IPv4-Only',
        });
        res.end(JSON.stringify({ mode: 'IPv4-only', message: 'Simulated IPv4-only resource' }));
        break;

      case '/api/broken-ipv6-tcp':
        // If accessed via IPv6 simulation header or test hook
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'X-NetScope-Simulated-Fault': 'IPv6-TCP-Reset',
        });
        res.end(JSON.stringify({ mode: 'Simulated-Fault', message: 'IPv6 TCP Reset' }));
        break;

      default:
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

// Standalone execution support
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startLabServer(PORT).then(() => {
    console.log(`[Controlled Lab] Listening on http://127.0.0.1:${PORT}`);
  });
}
