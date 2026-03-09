// WebSocket connection handler for ESP32 device
// Migrated to src/services/websocket-service.js

const config = require('../config');
const validators = require('../utils/validators');
const logger = require('../utils/logger');

class WebSocketService {
    constructor() {
        this.esp32Client = null;
        this.heartbeatTimer = null;
        this.heartbeatTimeout = null;
        this.pingTimer = null;
        this.lastPongTime = Date.now();
        this.latency = 0;
        this.logs = [];
        this.isAttackRunning = false;
        this.currentAttack = null;
        this.clientConnections = new Set();
    }

    /**
     * Handle new ESP32 WebSocket connection
     */
    handleEsp32Connection(ws) {
        if (this.esp32Client) {
            logger.warn('Rejected secondary ESP32 connection attempt');
            ws.close(1008, 'Another ESP32 device is already connected');
            return;
        }

        this.esp32Client = ws;
        this.lastPongTime = Date.now();

        logger.info('ESP32 device connected');
        this.broadcastStatus('ESP32 connected', 'connected');

        this.startHeartbeatMonitoring();
        this.startPingTimer();

        ws.on('message', (data) => this.handleEsp32Message(data));
        ws.on('close', () => this.handleEsp32Disconnect());
        ws.on('error', (error) => logger.error('ESP32 WebSocket error', { error: error.message }));
        ws.on('pong', () => {
            this.lastPongTime = Date.now();
            this.latency = this.lastPongTime - this.lastPingTime;
        });
    }

    /**
     * Handle frontend WebSocket connection
     */
    handleFrontendConnection(ws) {
        this.clientConnections.add(ws);
        logger.debug(`Frontend client connected. Total: ${this.clientConnections.size}`);

        this.sendStatusToClient(ws);
        ws.send(JSON.stringify({ type: 'logs_sync', logs: this.logs }));

        ws.on('message', (data) => this.handleFrontendMessage(data, ws));
        ws.on('close', () => {
            this.clientConnections.delete(ws);
            logger.debug(`Frontend client disconnected. Total: ${this.clientConnections.size}`);
        });
        ws.on('error', (error) => logger.error('Frontend WebSocket error', { error: error.message }));
    }

    /**
     * Handle messages from ESP32
     */
    handleEsp32Message(data) {
        try {
            const message = JSON.parse(data);

            if (message.type === 'heartbeat') {
                this.resetHeartbeatTimeout();
                return;
            }

            if (message.type === 'log_event') {
                this.addLog(message);
                this.broadcastToClients(message);
                return;
            }

            if (message.type === 'attack_started') {
                this.isAttackRunning = true;
                logger.info('Attack started confirmation received from ESP32', { attack: message.attack_type });
                this.broadcastToClients({ type: 'attack_status', running: true });
                return;
            }

            if (message.type === 'attack_stopped') {
                this.isAttackRunning = false;
                logger.info('Attack stopped confirmation received from ESP32');
                this.broadcastToClients({ type: 'attack_status', running: false });
                return;
            }

            if (message.type === 'error') {
                logger.error('ESP32 reported device error', { message: message.message });
                this.broadcastToClients({ type: 'device_error', message: message.message });
                return;
            }

            logger.debug('Received unknown message from ESP32', { type: message.type });
        } catch (error) {
            logger.error('Failed to parse ESP32 message', { error: error.message, data });
        }
    }

    /**
     * Handle messages from frontend
     */
    handleFrontendMessage(data, ws) {
        try {
            const message = JSON.parse(data);

            const handlers = {
                'start_attack': () => this.handleStartAttack(message),
                'stop_attack': () => this.handleStopAttack(),
                'pause_attack': () => this.sendToEsp32({ type: 'pause_attack' }),
                'resume_attack': () => this.sendToEsp32({ type: 'resume_attack' }),
                'kill': () => {
                    logger.warn('EMERGENCY KILL signal received');
                    this.sendToEsp32({ type: 'kill' });
                    this.isAttackRunning = false;
                    this.broadcastToClients({ type: 'attack_status', running: false });
                },
                'update_frequency': () => this.sendToEsp32(message),
                'update_id': () => this.sendToEsp32(message),
                'update_payload': () => this.sendToEsp32(message),
                'update_intensity': () => this.sendToEsp32(message),
                'clear_logs': () => this.clearLogs()
            };

            if (handlers[message.type]) {
                handlers[message.type]();
            } else {
                logger.debug('Received unknown message from frontend', { type: message.type });
            }
        } catch (error) {
            logger.error('Failed to parse frontend message', { error: error.message });
        }
    }

    /**
     * Handle start attack request
     */
    handleStartAttack(message) {
        if (!this.esp32Client) {
            this.broadcastToClients({ type: 'error', message: 'ESP32 not connected' });
            return;
        }

        const validation = validators.validateAttackMessage(message);
        if (!validation.valid) {
            logger.warn('Invalid attack configuration provided', { errors: validation.errors });
            this.broadcastToClients({ type: 'validation_error', errors: validation.errors });
            return;
        }

        if (message.parameters.payload) {
            message.parameters.payload = validators.normalizePayload(message.parameters.payload);
        }

        this.currentAttack = {
            type: message.attack_type,
            parameters: message.parameters,
            startTime: Date.now(),
        };

        logger.info('Initiating attack', { type: message.attack_type, params: message.parameters });
        this.sendToEsp32(message);
    }

    /**
     * Handle stop attack request
     */
    handleStopAttack() {
        logger.info('Stopping active attack');
        this.sendToEsp32({ type: 'stop_attack' });
        this.isAttackRunning = false;
        this.currentAttack = null;
    }

    /**
     * Add log entry
     */
    addLog(logEvent) {
        const entry = {
            timestamp: new Date().toISOString(),
            ...logEvent,
        };

        this.logs.push(entry);
        if (this.logs.length > config.MAX_QUEUED_LOGS) {
            this.logs = this.logs.slice(-config.MAX_QUEUED_LOGS);
        }
    }

    /**
     * Send message to ESP32
     */
    sendToEsp32(message) {
        if (!this.esp32Client) {
            logger.warn('Attempted to send to disconnected ESP32', { type: message.type });
            return;
        }

        try {
            this.esp32Client.send(JSON.stringify(message));
        } catch (error) {
            logger.error('Failed to send message to ESP32', { error: error.message });
        }
    }

    /**
     * Broadcast message to all frontend clients
     */
    broadcastToClients(message) {
        const data = JSON.stringify(message);
        this.clientConnections.forEach((client) => {
            if (client.readyState === 1) { client.send(data); }
        });
    }

    /**
     * Send status update to specific client
     */
    sendStatusToClient(ws) {
        const status = this.getStatus();
        status.type = 'status_update';
        if (ws.readyState === 1) { ws.send(JSON.stringify(status)); }
    }

    /**
     * Broadcast status to all clients
     */
    broadcastStatus(message, status) {
        const statusObj = this.getStatus();
        statusObj.type = 'status_update';
        statusObj.message = message;
        this.broadcastToClients(statusObj);
    }

    /**
     * Start heartbeat monitoring
     */
    startHeartbeatMonitoring() {
        this.resetHeartbeatTimeout();
    }

    /**
     * Reset heartbeat timeout
     */
    resetHeartbeatTimeout() {
        if (this.heartbeatTimeout) { clearTimeout(this.heartbeatTimeout); }
        this.heartbeatTimeout = setTimeout(() => {
            logger.warn('ESP32 heartbeat timeout reached');
            this.handleEsp32Disconnect();
        }, config.HEARTBEAT_TIMEOUT);
    }

    /**
     * Start ping timer for latency measurement
     */
    startPingTimer() {
        if (this.pingTimer) { clearInterval(this.pingTimer); }
        this.pingTimer = setInterval(() => {
            if (this.esp32Client && this.esp32Client.readyState === 1) {
                this.lastPingTime = Date.now();
                this.esp32Client.ping();
            }
        }, config.PING_INTERVAL);
    }

    /**
     * Handle ESP32 disconnect
     */
    handleEsp32Disconnect() {
        if (this.heartbeatTimeout) { clearTimeout(this.heartbeatTimeout); }
        if (this.pingTimer) { clearInterval(this.pingTimer); }

        logger.info('ESP32 device disconnected');
        this.esp32Client = null;
        this.isAttackRunning = false;
        this.currentAttack = null;
        this.latency = 0;
        this.broadcastStatus('ESP32 disconnected', 'disconnected');
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            esp32_connected: !!this.esp32Client,
            attack_running: this.isAttackRunning,
            latency: this.latency,
            current_attack: this.currentAttack,
            connected_clients: this.clientConnections.size,
        };
    }

    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = [];
        this.broadcastToClients({ type: 'logs_cleared' });
    }
}

module.exports = new WebSocketService();
