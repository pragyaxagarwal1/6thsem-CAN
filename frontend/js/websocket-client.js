// WebSocket client for the CAN attack dashboard

class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    this.isManualClose = false;
    this.messageQueue = [];
    this.handlers = {};
    this.lastMessageTime = Date.now();
    this.heartbeatInterval = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isManualClose = false;
          this.reconnectAttempts = 0;

          // Process queued messages
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
          }

          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.lastMessageTime = Date.now();

          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.emit('disconnected');

          if (!this.isManualClose) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Send message
   */
  send(message) {
    if (!message || typeof message !== 'object') {
      console.warn('[WebSocket] Invalid message:', message);
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Send error:', error);
        this.messageQueue.push(message);
      }
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
      console.warn('[WebSocket] Not connected, queuing message');
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    const { type } = message;

    if (this.handlers[type]) {
      this.handlers[type].forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`[WebSocket] Error in handler for ${type}:`, error);
        }
      });
    }

    // Also emit generic message event
    this.emit('message', message);
  }

  /**
   * Register message handler
   */
  on(type, handler) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(handler);
  }

  /**
   * Unregister message handler
   */
  off(type, handler) {
    if (this.handlers[type]) {
      this.handlers[type] = this.handlers[type].filter((h) => h !== handler);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    const eventHandlers = this.handlers[`_event_${event}`] || [];
    eventHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[WebSocket] Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Register event listener (for internal events like 'connected', 'disconnected')
   */
  addEventListener(event, handler) {
    if (!this.handlers[`_event_${event}`]) {
      this.handlers[`_event_${event}`] = [];
    }
    this.handlers[`_event_${event}`].push(handler);
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
    }, this.reconnectDelay);
  }

  /**
   * Manually disconnect
   */
  disconnect() {
    this.isManualClose = true;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.emit('disconnected');
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get ready state
   */
  getReadyState() {
    const states = {
      [WebSocket.CONNECTING]: 'Connecting',
      [WebSocket.OPEN]: 'Connected',
      [WebSocket.CLOSING]: 'Closing',
      [WebSocket.CLOSED]: 'Disconnected',
    };

    if (!this.ws) return 'Disconnected';
    return states[this.ws.readyState] || 'Unknown';
  }

  /**
   * Send start attack message
   */
  startAttack(attackType, parameters) {
    this.send({
      type: 'start_attack',
      attack_type: attackType,
      parameters,
    });
  }

  /**
   * Send stop attack message
   */
  stopAttack() {
    this.send({ type: 'stop_attack' });
  }

  /**
   * Send pause attack message
   */
  pauseAttack() {
    this.send({ type: 'pause_attack' });
  }

  /**
   * Send resume attack message
   */
  resumeAttack() {
    this.send({ type: 'resume_attack' });
  }

  /**
   * Send emergency kill
   */
  kill() {
    this.send({ type: 'kill' });
  }

  /**
   * Update frequency
   */
  updateFrequency(frequency) {
    this.send({
      type: 'update_frequency',
      frequency: parseInt(frequency),
    });
  }

  /**
   * Update CAN ID
   */
  updateId(id) {
    this.send({
      type: 'update_id',
      id,
    });
  }

  /**
   * Update payload
   */
  updatePayload(payload) {
    this.send({
      type: 'update_payload',
      payload: payload.toUpperCase().replace(/\s/g, ''),
    });
  }

  /**
   * Update intensity
   */
  updateIntensity(intensity) {
    this.send({
      type: 'update_intensity',
      intensity: parseInt(intensity),
    });
  }
}

// Global WebSocket client
let wsClient = null;

/**
 * Initialize WebSocket client
 */
function initializeWebSocket() {
  // Determine WebSocket URL based on current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  wsClient = new WebSocketClient(wsUrl);

  // Set User-Agent to identify as frontend
  wsClient.userAgent = 'WebBrowser-Frontend';

  return wsClient.connect();
}
