const http = require('http');
const fs = require('fs');
const path = require('path');

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = '0.0.0.0';

// Simple logger
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(path.join(__dirname, 'app.log'), line + '\n'); } catch {}
}

log('=== SERVER STARTING ===');
log(`Node ${process.version} | PORT=${port} | CWD=${process.cwd()}`);

// Check if build exists
const nextDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextDir)) {
  log('ERROR: .next folder not found. Run "npm run build" first.');
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui"><div style="text-align:center"><h1>Build Required</h1><p>Run <code>npm run build</code> then restart.</p></div></body></html>');
  });
  server.listen(port, hostname, () => log('Waiting for build...'));
} else {
  log('.next folder found, starting Next.js...');

  let isReady = false;
  let startError = null;

  // Start HTTP server immediately
  const server = http.createServer((req, res) => {
    if (req.url === '/_health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready: isReady, error: startError, uptime: process.uptime() }));
      return;
    }

    if (startError) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui"><div style="text-align:center"><h1>Startup Error</h1><pre style="text-align:left;background:#f5f5f5;padding:16px;border-radius:8px;max-width:600px;overflow:auto">${startError}</pre></div></body></html>`);
      return;
    }

    if (!isReady) {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui"><div style="text-align:center"><h2>Starting up...</h2><p>Please refresh in a few seconds.</p></div></body></html>');
      return;
    }

    try {
      const { parse } = require('url');
      const parsedUrl = parse(req.url, true);
      nextHandler(req, res, parsedUrl);
    } catch (err) {
      log(`Request error: ${err.message}`);
      if (!res.headersSent) { res.writeHead(500); res.end('Error'); }
    }
  });

  server.timeout = 30000;
  server.listen(port, hostname, () => log(`Listening on ${hostname}:${port}`));

  // Load Next.js
  let nextHandler;
  try {
    const next = require('next');
    const app = next({ dev: false, hostname, port, dir: __dirname });
    nextHandler = app.getRequestHandler();

    app.prepare()
      .then(() => { isReady = true; log('Next.js READY'); })
      .catch((err) => { startError = err.message; log(`Next.js FAILED: ${err.message}`); });
  } catch (err) {
    startError = err.message;
    log(`Next.js LOAD FAILED: ${err.message}`);
  }

  server.on('error', (err) => { log(`Server error: ${err.message}`); });
}

process.on('uncaughtException', (err) => log(`UNCAUGHT: ${err.message}`));
process.on('unhandledRejection', (err) => log(`UNHANDLED: ${err}`));
