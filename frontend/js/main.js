// Main entry point for the CAN attack dashboard
// Converted to ES6 Module

import { authManager } from './modules/auth.js';
import { uiManager } from './modules/ui.js';
import { WebSocketClient } from './modules/websocket-client.js';
import { getWebSocketUrl } from './modules/config.js';
import { showNotification } from './modules/utils.js';

let wsClient = null;

async function init() {
    // Check authentication
    if (!authManager.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Initialize UI
    uiManager.init();
    authManager.initSessionListeners();

    // Initialize WebSocket
    const wsUrl = getWebSocketUrl();
    wsClient = new WebSocketClient(wsUrl);

    // Setup WebSocket handlers
    setupWebSocketHandlers();

    // Connect
    try {
        await wsClient.connect();
        showNotification('System online and connected to control server', 'success');
    } catch (error) {
        showNotification('Control server unreachable. Retrying...', 'error');
    }

    // Bind UI buttons to WebSocket actions
    bindActions();
}

function setupWebSocketHandlers() {
    wsClient.addEventListener('connected', () => {
        uiManager.updateWebSocketState('Connected');
        uiManager.updateConnectionStatus(wsClient.isConnected());
    });

    wsClient.addEventListener('disconnected', () => {
        uiManager.updateWebSocketState('Disconnected');
        uiManager.updateConnectionStatus(false);
    });

    wsClient.addEventListener('reconnecting', (data) => {
        uiManager.updateWebSocketState(`Reconnecting (${data.attempt}/${data.max})...`);
    });

    wsClient.on('status_update', (msg) => {
        uiManager.updateConnectionStatus(msg.esp32_connected);
        uiManager.updateLatency(msg.latency);
        uiManager.updateConnectedClients(msg.connected_clients || 0);
        uiManager.updateAttackStatus(msg.attack_running, msg.current_attack?.type);
    });

    wsClient.on('log_event', (msg) => {
        uiManager.addLog(msg);
        if (wsClient.isAttackRunning) {
            uiManager.incrementCounter();
        }
    });

    wsClient.on('logs_sync', (msg) => {
        uiManager.clearUI();
        msg.logs.forEach(log => uiManager.addLog(log));
    });

    wsClient.on('attack_status', (msg) => {
        uiManager.updateAttackStatus(msg.running);
    });

    wsClient.on('error', (msg) => {
        showNotification(msg.message, 'error');
    });

    wsClient.on('validation_error', (msg) => {
        showNotification(`Invalid configuration: ${msg.errors.join(', ')}`, 'warning');
    });
}

function bindActions() {
    // Attack Controls
    uiManager.startAttackBtn.addEventListener('click', () => {
        const attack = uiManager.getCurrentAttackParams();
        if (attack) {
            uiManager.resetCounter();
            wsClient.startAttack(attack.type, attack.params);
        }
    });

    uiManager.stopAttackBtn.addEventListener('click', () => wsClient.stopAttack());
    uiManager.pauseAttackBtn.addEventListener('click', () => wsClient.pauseAttack());
    uiManager.resumeAttackBtn.addEventListener('click', () => wsClient.resumeAttack());
    uiManager.killBtn.addEventListener('click', () => wsClient.kill());

    // Connection Controls
    uiManager.reconnectBtn.addEventListener('click', () => wsClient.connect());
    uiManager.clearLogsBtn.addEventListener('click', () => {
        if (confirm('Clear logs from server as well?')) {
            wsClient.send({ type: 'clear_logs' });
        }
        uiManager.clearUI();
    });
    uiManager.exportLogsBtn.addEventListener('click', () => uiManager.exportLogs());

    // Parameter Updates
    uiManager.updateFreqBtn.addEventListener('click', () => wsClient.updateFrequency(uiManager.liveFreq.value));
    uiManager.updateIdBtn.addEventListener('click', () => wsClient.updateId(uiManager.liveId.value));
    uiManager.updatePayloadBtn.addEventListener('click', () => wsClient.updatePayload(uiManager.livePayload.value));
    uiManager.updateIntensityBtn.addEventListener('click', () => wsClient.updateIntensity(uiManager.liveIntensity.value));
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
