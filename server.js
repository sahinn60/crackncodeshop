const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = '0.0.0.0';
const dev = false;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log(`[Server] Starting Next.js on ${hostname}:${port}...`);
console.log(`[Server] NODE_ENV=${process.env.NODE_ENV}`);
console.log(`[Server] Node.js ${process.version}`);

app.prepare()
  .then(() => {
    const server = createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('[Server] Request error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    });

    // Timeouts
    server.timeout = 30000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    server.listen(port, hostname, () => {
      console.log(`[Server] Ready on http://${hostname}:${port}`);
    });

    server.on('error', (err) => {
      console.error('[Server] Server error:', err);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('[Server] Shutting down...');
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 5000);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })
  .catch((err) => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  });

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled rejection:', err);
});
