const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Node.js is running</h1><p>Port: ' + port + '</p><p>Node: ' + process.version + '</p>');
}).listen(port, '0.0.0.0', () => {
  console.log('Running on port ' + port);
});
