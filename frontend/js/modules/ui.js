// UI management module for the CAN attack dashboard
// Converted to ES6 Module

import { formatTime, escapeHtml, formatNumber, showNotification, downloadCSV } from './utils.js';
import { config } from './config.js';
import { authManager } from './auth.js';

export class UIManager {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.attackRunning = false;
        this.esp32Connected = false;
        this.displayedLogIds = new Set();
    }

    /**
     * Initialize UI elements
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.updateConnectionStatus(false);
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Connection Panel
        this.connectionStatus = document.getElementById('connectionStatus');
        this.esp32Status = document.getElementById('esp32Status');
        this.wsState = document.getElementById('wsState');
        this.latency = document.getElementById('latency');
        this.connectedClients = document.getElementById('connectedClients');
        this.reconnectBtn = document.getElementById('reconnectBtn');
        this.clearLogsBtn = document.getElementById('clearLogsBtn');
        this.exportLogsBtn = document.getElementById('exportLogsBtn');

        // Attack Panel
        this.attackType = document.getElementById('attackType');
        this.attackIndicator = document.getElementById('attackIndicator');

        // Spoofing
        this.spoofId = document.getElementById('spoofId');
        this.spoofPayload = document.getElementById('spoofPayload');
        this.spoofFreq = document.getElementById('spoofFreq');
        this.spoofFreqValue = document.getElementById('spoofFreqValue');
        this.spoofIntensity = document.getElementById('spoofIntensity');
        this.spoofIntensityValue = document.getElementById('spoofIntensityValue');
        this.spoofingParams = document.getElementById('spoofingParams');

        // DoS
        this.dosPayload = document.getElementById('dosPayload');
        this.dosFreq = document.getElementById('dosFreq');
        this.dosFreqValue = document.getElementById('dosFreqValue');
        this.dosIntensity = document.getElementById('dosIntensity');
        this.dosIntensityValue = document.getElementById('dosIntensityValue');
        this.dosParams = document.getElementById('dosParams');

        // Fuzzing
        this.fuzzMode = document.getElementById('fuzzMode');
        this.fuzzMinId = document.getElementById('fuzzMinId');
        this.fuzzMaxId = document.getElementById('fuzzMaxId');
        this.fuzzPayloadMode = document.getElementById('fuzzPayloadMode');
        this.fuzzFreq = document.getElementById('fuzzFreq');
        this.fuzzFreqValue = document.getElementById('fuzzFreqValue');
        this.fuzzIntensity = document.getElementById('fuzzIntensity');
        this.fuzzIntensityValue = document.getElementById('fuzzIntensityValue');
        this.fuzzingParams = document.getElementById('fuzzingParams');

        // Buttons
        this.startAttackBtn = document.getElementById('startAttackBtn');
        this.stopAttackBtn = document.getElementById('stopAttackBtn');
        this.pauseAttackBtn = document.getElementById('pauseAttackBtn');
        this.resumeAttackBtn = document.getElementById('resumeAttackBtn');
        this.killBtn = document.getElementById('killBtn');

        // Parameters Panel
        this.liveFreq = document.getElementById('liveFreq');
        this.liveId = document.getElementById('liveId');
        this.livePayload = document.getElementById('livePayload');
        this.liveIntensity = document.getElementById('liveIntensity');
        this.updateFreqBtn = document.getElementById('updateFreqBtn');
        this.updateIdBtn = document.getElementById('updateIdBtn');
        this.updatePayloadBtn = document.getElementById('updatePayloadBtn');
        this.updateIntensityBtn = document.getElementById('updateIntensityBtn');
        this.paramsStatus = document.getElementById('paramsStatus');

        // Log Panel
        this.logBody = document.getElementById('logBody');
        this.logTable = document.getElementById('logTable');
        this.logFilter = document.getElementById('logFilter');
        this.autoScrollToggle = document.getElementById('autoScrollToggle');
        this.logCount = document.getElementById('logCount');
        this.displayedCount = document.getElementById('displayedCount');

        // Logout
        this.logoutBtn = document.getElementById('logoutBtn');

        // Injection counter
        this.injectionCounter = document.getElementById('injectionCounter');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.attackType.addEventListener('change', (e) => this.onAttackTypeChange(e));

        // Range input helpers
        const setupRange = (range, value) => {
            range.addEventListener('input', (e) => { value.textContent = e.target.value; });
        };

        setupRange(this.spoofFreq, this.spoofFreqValue);
        setupRange(this.spoofIntensity, this.spoofIntensityValue);
        setupRange(this.dosFreq, this.dosFreqValue);
        setupRange(this.dosIntensity, this.dosIntensityValue);
        setupRange(this.fuzzFreq, this.fuzzFreqValue);
        setupRange(this.fuzzIntensity, this.fuzzIntensityValue);

        this.logFilter.addEventListener('change', (e) => this.filterLogs(e.target.value));
        this.logoutBtn.addEventListener('click', () => authManager.logout());
    }

    /**
     * Handle attack type change
     */
    onAttackTypeChange(e) {
        const type = e.target.value;
        this.spoofingParams.style.display = type === 'spoofing' ? 'block' : 'none';
        this.dosParams.style.display = type === 'dos' ? 'block' : 'none';
        this.fuzzingParams.style.display = type === 'fuzzing' ? 'block' : 'none';
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(connected) {
        this.esp32Connected = connected;
        const statusText = this.connectionStatus.querySelector('.status-text');

        if (connected) {
            this.connectionStatus.classList.remove('offline');
            this.connectionStatus.classList.add('neutral');
            if (statusText) statusText.textContent = 'CONNECTED';
            this.esp32Status.textContent = 'OPERATIONAL';
            this.esp32Status.classList.remove('disconnected-text');
            this.esp32Status.classList.add('success-text');
            this.reconnectBtn.style.display = 'none';
        } else {
            this.connectionStatus.classList.add('offline');
            this.connectionStatus.classList.remove('neutral');
            if (statusText) statusText.textContent = 'DISCONNECTED';
            this.esp32Status.textContent = 'OFFLINE';
            this.esp32Status.classList.remove('success-text');
            this.esp32Status.classList.add('disconnected-text');
            this.reconnectBtn.style.display = 'flex';
        }

        // Disable start attack button if ESP32 is offline
        this.startAttackBtn.disabled = !connected || this.attackRunning;
    }

    updateWebSocketState(state) {
        this.wsState.textContent = state.toUpperCase();
        if (state.toLowerCase() === 'connected') {
            this.wsState.className = 'value success-text';
        } else {
            this.wsState.className = 'value error-text';
        }
    }

    updateLatency(ms) { this.latency.textContent = `${ms} MS`; }
    updateConnectedClients(count) { this.connectedClients.textContent = count; }

    /**
     * Update attack status
     */
    updateAttackStatus(running, attackType) {
        this.attackRunning = running;
        if (running) {
            this.attackIndicator.classList.remove('neutral');
            this.attackIndicator.classList.add('active');
            this.attackIndicator.innerHTML = `<span>VECTOR ACTIVE: ${(attackType || 'UNKNOWN').toUpperCase()}</span>`;
            [this.startAttackBtn].forEach(b => b.disabled = true);
            [this.stopAttackBtn, this.pauseAttackBtn, this.resumeAttackBtn].forEach(b => b.disabled = false);
            this.injectionCounter.parentElement.style.display = 'block';
        } else {
            this.attackIndicator.classList.remove('active');
            this.attackIndicator.classList.add('neutral');
            this.attackIndicator.innerHTML = `<span>IDLE</span>`;
            [this.startAttackBtn].forEach(b => b.disabled = !this.esp32Connected);
            [this.stopAttackBtn, this.pauseAttackBtn, this.resumeAttackBtn].forEach(b => b.disabled = true);
            this.injectionCounter.parentElement.style.display = 'none';
        }
    }

    /**
     * Add log entry
     */
    addLog(logEntry) {
        const logId = `${logEntry.timestamp}-${Math.random()}`;
        const log = {
            id: logId,
            timestamp: logEntry.timestamp || new Date().toISOString(),
            attack_type: logEntry.attack_type || 'unknown',
            canId: logEntry.id || '--',
            payload: logEntry.payload || '--',
            frequency: logEntry.frequency || '--',
            status: logEntry.status || 'unknown',
        };

        this.logs.push(log);
        const filterType = this.logFilter?.value;
        if (!filterType || filterType === '' || filterType === log.attack_type) {
            this.filteredLogs.push(log);
            if (!this.displayedLogIds.has(logId)) {
                this.renderLogEntry(log);
                this.displayedLogIds.add(logId);
            }
        }

        this.updateLogCount();
        if (this.autoScrollToggle?.checked) { this.scrollLogToBottom(); }
    }

    /**
     * Render log entry
     */
    renderLogEntry(log) {
        const row = document.createElement('tr');
        row.className = `log-row log-row-${log.attack_type}`;
        row.innerHTML = `
      <td>${formatTime(new Date(log.timestamp))}</td>
      <td>${escapeHtml(log.attack_type)}</td>
      <td><code>${escapeHtml(String(log.canId))}</code></td>
      <td><code>${escapeHtml(String(log.payload))}</code></td>
      <td>${escapeHtml(String(log.frequency))}</td>
      <td><span class="status-badge">${escapeHtml(log.status)}</span></td>
    `;

        const emptyRow = this.logBody.querySelector('.log-empty');
        if (emptyRow) emptyRow.remove();

        this.logBody.appendChild(row);

        const rows = this.logBody.querySelectorAll('.log-row');
        if (rows.length > config.MAX_DISPLAYED_LOGS) rows[0].remove();
    }

    /**
     * Filter logs
     */
    filterLogs(type) {
        this.logBody.innerHTML = '';
        this.displayedLogIds.clear();

        this.filteredLogs = (!type || type === '') ? [...this.logs] : this.logs.filter(l => l.attack_type === type);

        const startIndex = Math.max(0, this.filteredLogs.length - config.LOG_BUFFER_SIZE);
        for (let i = startIndex; i < this.filteredLogs.length; i++) {
            const log = this.filteredLogs[i];
            this.renderLogEntry(log);
            this.displayedLogIds.add(log.id);
        }

        if (this.filteredLogs.length === 0) {
            this.logBody.innerHTML = '<tr class="log-empty"><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 40px;">NO EVENTS MATCH FILTER</td></tr>';
        }
        this.updateLogCount();
    }

    updateLogCount() {
        this.logCount.textContent = formatNumber(this.logs.length);
        this.displayedCount.textContent = formatNumber(this.filteredLogs.length);
    }

    scrollLogToBottom() {
        setTimeout(() => {
            const wrapper = this.logTable.parentElement;
            wrapper.scrollTop = wrapper.scrollHeight;
        }, 0);
    }

    clearUI() {
        this.logs = [];
        this.filteredLogs = [];
        this.displayedLogIds.clear();
        this.logBody.innerHTML = '<tr class="log-empty"><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 40px;">LISTENING FOR TRAFFIC...</td></tr>';
        this.updateLogCount();
        this.resetCounter();
    }

    exportLogs() {
        if (this.logs.length === 0) { showNotification('No logs to export', 'warning'); return; }
        const headers = ['Timestamp', 'Attack Type', 'CAN ID', 'Payload', 'Frequency', 'Status'];
        const csv = [
            headers.join(','),
            ...this.logs.map(l => [l.timestamp, l.attack_type, l.canId, l.payload, l.frequency, l.status].map(c => `"${c}"`).join(','))
        ].join('\n');
        downloadCSV(csv, `can-attack-logs-${Date.now()}.csv`);
        showNotification('Logs exported', 'success');
    }

    getCurrentAttackParams() {
        const type = this.attackType.value;
        const params = {
            spoofing: () => ({ type, params: { id: this.spoofId.value, payload: this.spoofPayload.value, frequency: parseInt(this.spoofFreq.value), intensity: parseInt(this.spoofIntensity.value) } }),
            dos: () => ({ type, params: { frequency: parseInt(this.dosFreq.value), intensity: parseInt(this.dosIntensity.value), payload: this.dosPayload.value || undefined } }),
            fuzzing: () => ({ type, params: { fuzz_mode: this.fuzzMode.value, min_id: this.fuzzMinId.value, max_id: this.fuzzMaxId.value, payload_mode: this.fuzzPayloadMode.value, frequency: parseInt(this.fuzzFreq.value), intensity: parseInt(this.fuzzIntensity.value) } })
        };
        return params[type] ? params[type]() : null;
    }

    updateParamStatus(msg) { this.paramsStatus.textContent = msg; }
    incrementCounter() { this.injectionCounter.textContent = formatNumber(parseInt(this.injectionCounter.textContent) + 1); }
    resetCounter() { this.injectionCounter.textContent = '0'; }
}

export const uiManager = new UIManager();
