// Main backend server entry point
const http = require('http');
const WebSocket = require('ws');
const os = require('os');
const app = require('./src/app');
const config = require('./src/config');
const wsService = require('./src/services/websocket-service');
const logger = require('./src/utils/logger');

// Initialize HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  logger.info(`New connection attempt from ${clientIp}`, { userAgent });

  // Detection: if user-agent contains 'ESP' or 'Arduino', treat as ESP32
  const isEsp32 = /ESP|Arduino/i.test(userAgent);

  if (isEsp32) {
    wsService.handleEsp32Connection(ws);
  } else {
    wsService.handleFrontendConnection(ws);
  }
});

// Helper to get local IP addresses
function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }
  return addresses;
}

const PORT = config.PORT;
const localIps = getLocalIps();

server.listen(PORT, config.HOST, () => {
  const ipList = localIps.map(ip => `    - [${ip.name}] http://${ip.address}:${PORT}`).join('\n');
  const mainIp = localIps.find(ip => ip.address.startsWith('192.168.'))?.address || 'localhost';

  console.log(`
╔════════════════════════════════════════════════╗
║   CAN Attack Control Dashboard - Backend       ║
╚════════════════════════════════════════════════╝

✓ Server running on http://localhost:${PORT}
✓ Network access points:
${ipList}

Ready to accept ESP32 connections...
`);
  logger.info(`Server started on port ${PORT}`, { availableIps: localIps.map(i => i.address) });
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received: closing server`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
