// WebSocket connection handler for ESP32 device

const config = require('./config');
const validators = require('./validators');

class WebSocketHandler {
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
    // Only allow one ESP32 connection
    if (this.esp32Client) {
      ws.close(1008, 'Another ESP32 device is already connected');
      return;
    }

    this.esp32Client = ws;
    this.lastPongTime = Date.now();

    console.log('[ESP32] Connected');
    this.broadcastStatus('ESP32 connected', 'connected');

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();

    // Start ping/latency measurement
    this.startPingTimer();

    ws.on('message', (data) => this.handleEsp32Message(data));
    ws.on('close', () => this.handleEsp32Disconnect());
    ws.on('error', (error) => console.error('[ESP32] Error:', error));
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

    console.log(`[Frontend] Client connected (total: ${this.clientConnections.size})`);

    // Send current status to new client
    this.sendStatusToClient(ws);

    // Send existing logs
    ws.send(
      JSON.stringify({
        type: 'logs_sync',
        logs: this.logs,
      })
    );

    ws.on('message', (data) => this.handleFrontendMessage(data, ws));
    ws.on('close', () => {
      this.clientConnections.delete(ws);
      console.log(
        `[Frontend] Client disconnected (total: ${this.clientConnections.size})`
      );
    });
    ws.on('error', (error) => console.error('[Frontend] Error:', error));
  }

  /**
   * Handle messages from ESP32
   */
  handleEsp32Message(data) {
    try {
      const message = JSON.parse(data);

      if (message.type === 'heartbeat') {
        this.resetHeartbeatTimeout();
        this.broadcastStatus('ESP32 heartbeat received', 'connected');
        return;
      }

      if (message.type === 'log_event') {
        this.addLog(message);
        this.broadcastToClients(message);
        return;
      }

      if (message.type === 'attack_started') {
        this.isAttackRunning = true;
        this.broadcastToClients({
          type: 'attack_status',
          running: true,
        });
        return;
      }

      if (message.type === 'attack_stopped') {
        this.isAttackRunning = false;
        this.broadcastToClients({
          type: 'attack_status',
          running: false,
        });
        return;
      }

      if (message.type === 'error') {
        console.error('[ESP32] Device error:', message.message);
        this.broadcastToClients({
          type: 'device_error',
          message: message.message,
        });
        return;
      }

      console.log('[ESP32] Received unknown message type:', message.type);
    } catch (error) {
      console.error('[ESP32] Failed to parse message:', error);
    }
  }

  /**
   * Handle messages from frontend
   */
  handleFrontendMessage(data, ws) {
    try {
      const message = JSON.parse(data);

      if (message.type === 'start_attack') {
        this.handleStartAttack(message);
        return;
      }

      if (message.type === 'stop_attack') {
        this.handleStopAttack();
        return;
      }

      if (message.type === 'pause_attack') {
        this.sendToEsp32({
          type: 'pause_attack',
        });
        return;
      }

      if (message.type === 'resume_attack') {
        this.sendToEsp32({
          type: 'resume_attack',
        });
        return;
      }

      if (message.type === 'kill') {
        this.sendToEsp32({ type: 'kill' });
        this.isAttackRunning = false;
        this.broadcastToClients({
          type: 'attack_status',
          running: false,
        });
        return;
      }

      if (message.type === 'update_frequency') {
        this.sendToEsp32(message);
        return;
      }

      if (message.type === 'update_id') {
        this.sendToEsp32(message);
        return;
      }

      if (message.type === 'update_payload') {
        this.sendToEsp32(message);
        return;
      }

      if (message.type === 'update_intensity') {
        this.sendToEsp32(message);
        return;
      }

      console.log('[Frontend] Received unknown message type:', message.type);
    } catch (error) {
      console.error('[Frontend] Failed to parse message:', error);
    }
  }

  /**
   * Handle start attack request
   */
  handleStartAttack(message) {
    if (!this.esp32Client) {
      this.broadcastToClients({
        type: 'error',
        message: 'ESP32 not connected',
      });
      return;
    }

    const validation = validators.validateAttackMessage(message);

    if (!validation.valid) {
      this.broadcastToClients({
        type: 'validation_error',
        errors: validation.errors,
      });
      return;
    }

    // Normalize payload
    if (message.parameters.payload) {
      message.parameters.payload = validators.normalizePayload(
        message.parameters.payload
      );
    }

    this.currentAttack = {
      type: message.attack_type,
      parameters: message.parameters,
      startTime: Date.now(),
    };

    this.sendToEsp32(message);
    console.log('[Attack] Started:', message.attack_type);
  }

  /**
   * Handle stop attack request
   */
  handleStopAttack() {
    this.sendToEsp32({
      type: 'stop_attack',
    });

    this.isAttackRunning = false;
    this.currentAttack = null;
    console.log('[Attack] Stopped');
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

    // Keep only last N logs
    if (this.logs.length > config.MAX_QUEUED_LOGS) {
      this.logs = this.logs.slice(-config.MAX_QUEUED_LOGS);
    }
  }

  /**
   * Send message to ESP32
   */
  sendToEsp32(message) {
    if (!this.esp32Client) {
      console.warn('[WebSocket] ESP32 not connected, discarding message');
      return;
    }

    try {
      this.esp32Client.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Failed to send to ESP32:', error);
    }
  }

  /**
   * Broadcast message to all frontend clients
   */
  broadcastToClients(message) {
    const data = JSON.stringify(message);
    this.clientConnections.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(data);
      }
    });
  }

  /**
   * Send status update to specific client
   */
  sendStatusToClient(ws) {
    const status = {
      type: 'status_update',
      esp32_connected: !!this.esp32Client,
      attack_running: this.isAttackRunning,
      latency: this.latency,
      current_attack: this.currentAttack,
    };

    if (ws.readyState === 1) {
      ws.send(JSON.stringify(status));
    }
  }

  /**
   * Broadcast status to all clients
   */
  broadcastStatus(message, status) {
    this.broadcastToClients({
      type: 'status_update',
      esp32_connected: !!this.esp32Client,
      attack_running: this.isAttackRunning,
      latency: this.latency,
      current_attack: this.currentAttack,
      message,
    });
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
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      console.warn('[ESP32] Heartbeat timeout - marking as disconnected');
      this.handleEsp32Disconnect();
    }, config.HEARTBEAT_TIMEOUT);
  }

  /**
   * Start ping timer for latency measurement
   */
  startPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

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
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    this.esp32Client = null;
    this.isAttackRunning = false;
    this.currentAttack = null;
    this.latency = 0;

    console.log('[ESP32] Disconnected');
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
    this.broadcastToClients({
      type: 'logs_cleared',
    });
  }
}

module.exports = WebSocketHandler;
