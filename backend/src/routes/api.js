// API Routing
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const logsController = require('../controllers/logsController');
const statusController = require('../controllers/statusController');
const wsService = require('../services/websocket-service');

// Auth routes
router.post('/login', authController.login);

// Status routes
router.get('/health', statusController.getHealth);
router.get('/status', statusController.getStatus(wsService));
router.get('/config', statusController.getConfig);

// Logs routes
router.get('/logs', logsController.getLogs(wsService));
router.post('/logs/clear', logsController.clearLogs(wsService));
router.get('/logs/export', logsController.exportLogs(wsService));

module.exports = router;
