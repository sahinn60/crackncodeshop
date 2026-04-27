// Minimal test server — no dependencies, no Next.js
// To test: set startup file to test-server.js in Hostinger hPanel
const http = require('http');
const port = parseInt(process.env.PORT, 10) || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'OK',
    message: 'Node.js is working on Hostinger!',
    node: process.version,
    port: port,
    env_PORT: process.env.PORT || 'not set',
    env_NODE_ENV: process.env.NODE_ENV || 'not set',
    cwd: process.cwd(),
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
    timestamp: new Date().toISOString(),
  }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on 0.0.0.0:${port}`);
});
