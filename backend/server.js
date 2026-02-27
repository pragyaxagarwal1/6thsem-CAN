// Main backend server file for CAN Attack Control Dashboard

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const WebSocketHandler = require('./websocket-handler');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler();

// Track which clients are ESP32 vs frontend based on connection URL or message
const wsConnections = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  console.log(`[WebSocket] New connection from ${clientIp}`);

  // Simple detection: if user-agent contains 'ESP' or 'Arduino', treat as ESP32
  // Otherwise, treat as frontend
  const isEsp32 = /ESP|Arduino/i.test(userAgent);

  if (isEsp32) {
    wsHandler.handleEsp32Connection(ws);
    wsConnections.set(ws, 'esp32');
  } else {
    wsHandler.handleFrontendConnection(ws);
    wsConnections.set(ws, 'frontend');
  }

  // Clean up on connection close
  ws.on('close', () => {
    wsConnections.delete(ws);
  });
});

// REST API endpoints

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get current status
 */
app.get('/api/status', (req, res) => {
  res.json(wsHandler.getStatus());
});

/**
 * Get all logs
 */
app.get('/api/logs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;

  const logs = wsHandler.logs.slice(offset, offset + limit);

  res.json({
    logs,
    total: wsHandler.logs.length,
    limit,
    offset,
  });
});

/**
 * Clear logs
 */
app.post('/api/logs/clear', (req, res) => {
  wsHandler.clearLogs();
  res.json({ message: 'Logs cleared' });
});

/**
 * Export logs as CSV
 */
app.get('/api/logs/export', (req, res) => {
  if (wsHandler.logs.length === 0) {
    return res.status(400).json({ error: 'No logs to export' });
  }

  // Build CSV header
  const headers = [
    'Timestamp',
    'Attack Type',
    'CAN ID',
    'Payload',
    'Frequency',
    'Status',
  ];

  // Build CSV rows
  const rows = wsHandler.logs.map((log) => [
    log.timestamp || '',
    log.attack_type || '',
    log.id || '',
    log.payload || '',
    log.frequency || '',
    log.status || '',
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="can-attack-logs.csv"'
  );
  res.send(csvContent);
});

/**
 * Get configuration
 */
app.get('/api/config', (req, res) => {
  res.json({
    ATTACK_TYPES: config.ATTACK_TYPES,
    FUZZ_MODES: config.FUZZ_MODES,
    FREQUENCY_LIMITS: config.FREQUENCY_LIMITS,
    INTENSITY_LIMITS: config.INTENSITY_LIMITS,
  });
});

/**
 * Serve login page
 */
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

/**
 * Login endpoint
 */
app.post('/api/login', express.json(), (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password === config.LOGIN_PASSWORD) {
    res.json({
      success: true,
      token: Buffer.from(password).toString('base64'),
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

/**
 * Serve dashboard (with fallback to index.html for SPA routing)
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.PORT;
server.listen(PORT, config.HOST, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   CAN Attack Control Dashboard - Backend       ║
╚════════════════════════════════════════════════╝

✓ Server running on http://localhost:${PORT}
✓ WebSocket server ready on ws://localhost:${PORT}
✓ Frontend available at http://localhost:${PORT}

Configuration:
  - Login password: ${config.LOGIN_PASSWORD}
  - Max logs in memory: ${config.MAX_QUEUED_LOGS}
  - Heartbeat interval: ${config.HEARTBEAT_INTERVAL}ms
  - Heartbeat timeout: ${config.HEARTBEAT_TIMEOUT}ms

Ready to accept ESP32 connections...
`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
