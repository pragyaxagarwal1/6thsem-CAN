// WebSocket client for the CAN attack dashboard
// Converted to ES6 Module

import { config } from './config.js';

export class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = config.RECONNECT_ATTEMPTS;
        this.reconnectDelay = config.RECONNECT_DELAY;
        this.isManualClose = false;
        this.messageQueue = [];
        this.handlers = {};
        this.lastMessageTime = Date.now();
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

                    while (this.messageQueue.length > 0) {
                        this.send(this.messageQueue.shift());
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
        if (!message || typeof message !== 'object') return;

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('[WebSocket] Send error:', error);
                this.messageQueue.push(message);
            }
        } else {
            this.messageQueue.push(message);
        }
    }

    /**
     * Handle incoming message
     */
    handleMessage(message) {
        const { type } = message;
        if (this.handlers[type]) {
            this.handlers[type].forEach((handler) => {
                try { handler(message); } catch (e) { console.error(e); }
            });
        }
        this.emit('message', message);
    }

    /**
     * Register message handler
     */
    on(type, handler) {
        if (!this.handlers[type]) { this.handlers[type] = []; }
        this.handlers[type].push(handler);
    }

    /**
     * Emit event
     */
    emit(event, data) {
        const eventHandlers = this.handlers[`_event_${event}`] || [];
        eventHandlers.forEach((handler) => {
            try { handler(data); } catch (e) { console.error(e); }
        });
    }

    /**
     * Register event listener
     */
    addEventListener(event, handler) {
        if (!this.handlers[`_event_${event}`]) { this.handlers[`_event_${event}`] = []; }
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
        this.emit('reconnecting', { attempt: this.reconnectAttempts, max: this.maxReconnectAttempts });
        setTimeout(() => {
            this.connect().catch(() => { });
        }, this.reconnectDelay);
    }

    /**
     * Manually disconnect
     */
    disconnect() {
        this.isManualClose = true;
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

    // Attack control methods
    startAttack(attackType, parameters) {
        this.send({ type: 'start_attack', attack_type: attackType, parameters });
    }

    stopAttack() { this.send({ type: 'stop_attack' }); }
    pauseAttack() { this.send({ type: 'pause_attack' }); }
    resumeAttack() { this.send({ type: 'resume_attack' }); }
    kill() { this.send({ type: 'kill' }); }

    updateFrequency(frequency) { this.send({ type: 'update_frequency', frequency: parseInt(frequency) }); }
    updateId(id) { this.send({ type: 'update_id', id }); }
    updatePayload(payload) { this.send({ type: 'update_payload', payload: payload.toUpperCase().replace(/\s/g, '') }); }
    updateIntensity(intensity) { this.send({ type: 'update_intensity', intensity: parseInt(intensity) }); }
}
