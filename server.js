const http = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

// Log to file for debugging on Hostinger
const logFile = fs.createWriteStream('./app.log', { flags: 'a' });
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logFile.write(line + '\n');
}

log('=== APP STARTING ===');
log(`Node.js ${process.version}`);
log(`NODE_ENV=${process.env.NODE_ENV || 'undefined'}`);
log(`PORT=${process.env.PORT || 'undefined'}`);
log(`CWD=${process.cwd()}`);

const dev = false;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

let nextApp;
let nextHandler;
let isReady = false;

try {
  nextApp = next({ dev, hostname, port, dir: __dirname });
  nextHandler = nextApp.getRequestHandler();
} catch (err) {
  log(`FATAL: Failed to initialize Next.js: ${err.message}`);
  log(err.stack);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Health check — responds immediately even before Next.js is ready
  if (req.url === '/_health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: isReady ? 'ready' : 'starting', uptime: process.uptime() }));
    return;
  }

  if (!isReady) {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui"><div style="text-align:center"><h2>Starting up...</h2><p>Please refresh in a few seconds.</p></div></body></html>');
    return;
  }

  try {
    const parsedUrl = parse(req.url, true);
    nextHandler(req, res, parsedUrl);
  } catch (err) {
    log(`Request error: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
});

server.timeout = 30000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Start listening FIRST, then prepare Next.js
// This way Passenger/proxy sees the app is alive immediately
server.listen(port, hostname, () => {
  log(`HTTP server listening on ${hostname}:${port}`);

  // Now prepare Next.js in the background
  nextApp.prepare()
    .then(() => {
      isReady = true;
      log('Next.js is ready — serving requests');
    })
    .catch((err) => {
      log(`FATAL: Next.js prepare failed: ${err.message}`);
      log(err.stack);
    });
});

server.on('error', (err) => {
  log(`Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    log(`Port ${port} is already in use`);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`);
  log(err.stack);
});

process.on('unhandledRejection', (err) => {
  log(`Unhandled rejection: ${err}`);
});

const shutdown = () => {
  log('Shutting down...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
