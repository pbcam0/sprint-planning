const http = require('http');
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, '../sprint_capacity_planner.html'), 'utf8');
const PORT = process.env.TEST_PORT || 3001;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
}).listen(PORT, () => console.log(`Test server on http://localhost:${PORT}`));
