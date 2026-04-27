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
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.listen(port, hostname, () => {
      console.log(`[Server] Ready on http://${hostname}:${port}`);
    });

    server.on('error', (err) => {
      console.error('[Server] Server error:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  });

// Prevent crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled rejection:', err);
});
