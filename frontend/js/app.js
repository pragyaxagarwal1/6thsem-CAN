// Main application controller for the CAN attack dashboard

class DashboardApp {
  constructor() {
    this.wsClient = null;
    this.statusUpdateInterval = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Initialize UI
      uiManager.init();

      // Initialize WebSocket
      console.log('[App] Initializing WebSocket...');
      await initializeWebSocket();
      this.wsClient = wsClient;

      // Register WebSocket event handlers
      this.registerWebSocketHandlers();

      // Attach button event handlers
      this.attachButtonHandlers();

      // Start status polling
      this.startStatusPolling();

      this.isInitialized = true;
      console.log('[App] Dashboard initialized');

      showNotification('Dashboard ready', 'success');
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      showNotification('Failed to initialize dashboard: ' + error.message, 'error');
    }
  }

  /**
   * Register WebSocket event handlers
   */
  registerWebSocketHandlers() {
    // Connection events
    this.wsClient.addEventListener('connected', () => {
      console.log('[App] WebSocket connected');
      uiManager.updateWebSocketState('Connected');
      showNotification('Connected to server', 'success');
    });

    this.wsClient.addEventListener('disconnected', () => {
      console.log('[App] WebSocket disconnected');
      uiManager.updateWebSocketState('Disconnected');
      uiManager.updateConnectionStatus(false);
      showNotification('Disconnected from server', 'warning');
    });

    this.wsClient.addEventListener('reconnect_failed', () => {
      console.error('[App] Reconnection failed');
      showNotification('Failed to reconnect to server', 'error');
    });

    // Status updates
    this.wsClient.on('status_update', (message) => {
      this.handleStatusUpdate(message);
    });

    // Connection status
    this.wsClient.on('esp32_connected', (message) => {
      uiManager.updateConnectionStatus(true);
      showNotification('ESP32 connected', 'success');
    });

    // Log events
    this.wsClient.on('log_event', (message) => {
      uiManager.addLog(message);
      uiManager.incrementCounter();
    });

    // Attack status
    this.wsClient.on('attack_status', (message) => {
      uiManager.updateAttackStatus(message.running);
    });

    // Attack started
    this.wsClient.on('attack_started', (message) => {
      uiManager.resetCounter();
      const attackType = message.attack_type || 'unknown';
      uiManager.updateAttackStatus(true, attackType);
      showNotification(`${attackType} attack started`, 'success');
    });

    // Attack stopped
    this.wsClient.on('attack_stopped', (message) => {
      uiManager.updateAttackStatus(false);
      showNotification('Attack stopped', 'info');
    });

    // Validation errors
    this.wsClient.on('validation_error', (message) => {
      const errors = message.errors || [];
      const errorText = errors.join(', ');
      showNotification('Validation error: ' + errorText, 'error');
    });

    // Device errors
    this.wsClient.on('device_error', (message) => {
      showNotification('Device error: ' + message.message, 'error');
    });

    // Log sync
    this.wsClient.on('logs_sync', (message) => {
      const logs = message.logs || [];
      logs.forEach((log) => uiManager.addLog(log));
    });

    // Logs cleared
    this.wsClient.on('logs_cleared', () => {
      uiManager.clearLogs();
    });

    // Generic error
    this.wsClient.on('error', (message) => {
      showNotification('Error: ' + (message?.message || 'Unknown error'), 'error');
    });

    // Latency updates (from ping/pong)
    this.wsClient.on('latency_update', (message) => {
      if (message.latency !== undefined) {
        uiManager.updateLatency(message.latency);
      }
    });
  }

  /**
   * Handle status update from server
   */
  handleStatusUpdate(message) {
    if (message.esp32_connected !== undefined) {
      uiManager.updateConnectionStatus(message.esp32_connected);
    }

    if (message.attack_running !== undefined) {
      const currentAttack = message.current_attack;
      const attackType = currentAttack?.type || 'unknown';
      uiManager.updateAttackStatus(message.attack_running, attackType);

      if (message.attack_running) {
        uiManager.resetCounter();
      }
    }

    if (message.latency !== undefined) {
      uiManager.updateLatency(message.latency);
    }

    if (message.connected_clients !== undefined) {
      uiManager.updateConnectedClients(message.connected_clients);
    }

    if (message.message) {
      console.log('[Status]', message.message);
    }
  }

  /**
   * Attach button event handlers
   */
  attachButtonHandlers() {
    // Reconnect button
    uiManager.reconnectBtn.addEventListener('click', () => {
      if (this.wsClient && !this.wsClient.isConnected()) {
        showNotification('Attempting to reconnect...', 'info');
        this.wsClient.attemptReconnect();
      } else {
        showNotification('Already connected', 'warning');
      }
    });

    // Clear logs button
    uiManager.clearLogsBtn.addEventListener('click', () => {
      uiManager.clearLogs();
      this.wsClient.send({ type: 'clear_logs' });
    });

    // Export logs button
    uiManager.exportLogsBtn.addEventListener('click', () => {
      uiManager.exportLogs();
    });

    // Start attack button
    uiManager.startAttackBtn.addEventListener('click', () => this.startAttack());

    // Stop attack button
    uiManager.stopAttackBtn.addEventListener('click', () => this.stopAttack());

    // Pause attack button
    uiManager.pauseAttackBtn.addEventListener('click', () => this.pauseAttack());

    // Resume attack button
    uiManager.resumeAttackBtn.addEventListener('click', () => this.resumeAttack());

    // Emergency kill button
    uiManager.killBtn.addEventListener('click', () => this.emergencyKill());

    // Live parameter update buttons
    uiManager.updateFreqBtn.addEventListener('click', () => this.updateFrequency());
    uiManager.updateIdBtn.addEventListener('click', () => this.updateId());
    uiManager.updatePayloadBtn.addEventListener('click', () => this.updatePayload());
    uiManager.updateIntensityBtn.addEventListener('click', () => this.updateIntensity());
  }

  /**
   * Start attack
   */
  startAttack() {
    const attackConfig = uiManager.getCurrentAttackParams();

    if (!attackConfig) {
      showNotification('Invalid attack configuration', 'error');
      return;
    }

    if (!this.wsClient || !this.wsClient.isConnected()) {
      showNotification('Not connected to server', 'error');
      return;
    }

    if (!uiManager.esp32Connected) {
      showNotification('ESP32 not connected', 'error');
      return;
    }

    console.log('[App] Starting attack:', attackConfig);
    this.wsClient.startAttack(attackConfig.type, attackConfig.params);
  }

  /**
   * Stop attack
   */
  stopAttack() {
    if (!this.wsClient) {
      showNotification('Not connected', 'error');
      return;
    }

    console.log('[App] Stopping attack');
    this.wsClient.stopAttack();
  }

  /**
   * Pause attack
   */
  pauseAttack() {
    if (!this.wsClient) {
      showNotification('Not connected', 'error');
      return;
    }

    console.log('[App] Pausing attack');
    this.wsClient.pauseAttack();
    showNotification('Attack paused', 'info');
  }

  /**
   * Resume attack
   */
  resumeAttack() {
    if (!this.wsClient) {
      showNotification('Not connected', 'error');
      return;
    }

    console.log('[App] Resuming attack');
    this.wsClient.resumeAttack();
    showNotification('Attack resumed', 'info');
  }

  /**
   * Emergency kill
   */
  emergencyKill() {
    if (!confirm('EMERGENCY KILL - This will immediately stop all injections. Continue?')) {
      return;
    }

    if (!this.wsClient) {
      showNotification('Not connected', 'error');
      return;
    }

    console.log('[App] EMERGENCY KILL');
    this.wsClient.kill();
    showNotification('EMERGENCY KILL sent!', 'error', 2000);
  }

  /**
   * Update frequency
   */
  updateFrequency() {
    const freq = uiManager.liveFreq.value.trim();

    if (!freq) {
      showNotification('Please enter a frequency value', 'warning');
      return;
    }

    const freqNum = parseInt(freq);
    if (isNaN(freqNum) || freqNum < 1) {
      showNotification('Invalid frequency value', 'error');
      return;
    }

    this.wsClient.updateFrequency(freqNum);
    uiManager.updateParamStatus(`Frequency updated to ${freqNum} Hz`);
    showNotification('Frequency parameter updated', 'success');
    uiManager.liveFreq.value = '';
  }

  /**
   * Update CAN ID
   */
  updateId() {
    const id = uiManager.liveId.value.trim();

    if (!id) {
      showNotification('Please enter a CAN ID', 'warning');
      return;
    }

    if (!isValidHex(id)) {
      showNotification('Invalid hex format for CAN ID', 'error');
      return;
    }

    this.wsClient.updateId(id);
    uiManager.updateParamStatus(`CAN ID updated to ${id}`);
    showNotification('CAN ID parameter updated', 'success');
    uiManager.liveId.value = '';
  }

  /**
   * Update payload
   */
  updatePayload() {
    const payload = uiManager.livePayload.value.trim();

    if (!payload) {
      showNotification('Please enter a payload', 'warning');
      return;
    }

    const cleanPayload = payload.replace(/\s/g, '');
    if (cleanPayload.length !== 16) {
      showNotification('Payload must be exactly 8 bytes (16 hex characters)', 'error');
      return;
    }

    if (!isValidHex(cleanPayload)) {
      showNotification('Invalid hex format for payload', 'error');
      return;
    }

    this.wsClient.updatePayload(payload);
    uiManager.updateParamStatus(`Payload updated to ${cleanPayload}`);
    showNotification('Payload parameter updated', 'success');
    uiManager.livePayload.value = '';
  }

  /**
   * Update intensity
   */
  updateIntensity() {
    const intensity = uiManager.liveIntensity.value.trim();

    if (!intensity) {
      showNotification('Please enter an intensity value', 'warning');
      return;
    }

    const intensityNum = parseInt(intensity);
    if (isNaN(intensityNum) || intensityNum < 1 || intensityNum > 100) {
      showNotification('Intensity must be between 1 and 100', 'error');
      return;
    }

    this.wsClient.updateIntensity(intensityNum);
    uiManager.updateParamStatus(`Intensity updated to ${intensityNum}`);
    showNotification('Intensity parameter updated', 'success');
    uiManager.liveIntensity.value = '';
  }

  /**
   * Start status polling
   */
  startStatusPolling() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    this.statusUpdateInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/status');
        const status = await response.json();

        // Update UI with status
        if (status) {
          if (status.esp32_connected !== undefined) {
            uiManager.updateConnectionStatus(status.esp32_connected);
          }
          if (status.latency !== undefined) {
            uiManager.updateLatency(status.latency);
          }
        }
      } catch (error) {
        // Silently ignore polling errors
        console.debug('[Status Poll] Error:', error);
      }
    }, 2000);
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    if (this.wsClient) {
      this.wsClient.disconnect();
    }
  }
}

// Global app instance
const app = new DashboardApp();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app.cleanup();
});
