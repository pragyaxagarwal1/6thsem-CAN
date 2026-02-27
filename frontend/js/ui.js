// UI management module for the CAN attack dashboard

class UIManager {
  constructor() {
    this.logs = [];
    this.filteredLogs = [];
    this.attackRunning = false;
    this.esp32Connected = false;
    this.injectionCounter = 0;
    this.logBufferSize = 50; // Render logs in batches
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
    // Attack type change
    this.attackType.addEventListener('change', (e) => this.onAttackTypeChange(e));

    // Range inputs for parameter display
    this.spoofFreq.addEventListener('input', (e) => {
      this.spoofFreqValue.textContent = e.target.value;
    });
    this.spoofIntensity.addEventListener('input', (e) => {
      this.spoofIntensityValue.textContent = e.target.value;
    });

    this.dosFreq.addEventListener('input', (e) => {
      this.dosFreqValue.textContent = e.target.value;
    });
    this.dosIntensity.addEventListener('input', (e) => {
      this.dosIntensityValue.textContent = e.target.value;
    });

    this.fuzzFreq.addEventListener('input', (e) => {
      this.fuzzFreqValue.textContent = e.target.value;
    });
    this.fuzzIntensity.addEventListener('input', (e) => {
      this.fuzzIntensityValue.textContent = e.target.value;
    });

    // Log filter
    this.logFilter.addEventListener('change', (e) => this.filterLogs(e.target.value));

    // Logout
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

    if (connected) {
      this.connectionStatus.classList.remove('disconnected');
      this.connectionStatus.classList.add('connected');
      this.esp32Status.textContent = 'Connected';
      this.esp32Status.classList.remove('disconnected-text');
    } else {
      this.connectionStatus.classList.add('disconnected');
      this.connectionStatus.classList.remove('connected');
      this.esp32Status.textContent = 'Not Connected';
      this.esp32Status.classList.add('disconnected-text');
    }
  }

  /**
   * Update WebSocket state
   */
  updateWebSocketState(state) {
    this.wsState.textContent = state;
  }

  /**
   * Update latency
   */
  updateLatency(ms) {
    this.latency.textContent = `${ms} ms`;
  }

  /**
   * Update connected clients count
   */
  updateConnectedClients(count) {
    this.connectedClients.textContent = count;
  }

  /**
   * Update attack status
   */
  updateAttackStatus(running, attackType) {
    this.attackRunning = running;

    if (running) {
      this.attackIndicator.classList.add('active');
      this.attackIndicator.innerHTML = `
        <span class="indicator-dot"></span>
        <span>ATTACK ACTIVE - ${attackType.toUpperCase()}</span>
      `;
      this.startAttackBtn.disabled = true;
      this.stopAttackBtn.disabled = false;
      this.pauseAttackBtn.disabled = false;
      this.resumeAttackBtn.disabled = false;
      this.injectionCounter.parentElement.style.display = 'block';
    } else {
      this.attackIndicator.classList.remove('active');
      this.attackIndicator.innerHTML = `
        <span class="indicator-dot"></span>
        <span>Idle</span>
      `;
      this.startAttackBtn.disabled = false;
      this.stopAttackBtn.disabled = true;
      this.pauseAttackBtn.disabled = true;
      this.resumeAttackBtn.disabled = true;
      this.injectionCounter.parentElement.style.display = 'none';
    }
  }

  /**
   * Add log entry
   */
  addLog(logEntry) {
    // Create a unique ID for the log
    const logId = `${logEntry.timestamp}-${Math.random()}`;

    const log = {
      id: logId,
      timestamp: logEntry.timestamp || new Date().toISOString(),
      attack_type: logEntry.attack_type || 'unknown',
      id: logEntry.id || '--',
      payload: logEntry.payload || '--',
      frequency: logEntry.frequency || '--',
      status: logEntry.status || 'unknown',
    };

    this.logs.push(log);

    // Apply current filter
    const filterType = this.logFilter?.value;
    if (!filterType || filterType === '' || filterType === log.attack_type) {
      this.filteredLogs.push(log);

      if (!this.displayedLogIds.has(logId)) {
        this.renderLogEntry(log);
        this.displayedLogIds.add(logId);
      }
    }

    // Update log count
    this.updateLogCount();

    // Auto-scroll if enabled
    if (this.autoScrollToggle?.checked) {
      this.scrollLogToBottom();
    }
  }

  /**
   * Render a single log entry
   */
  renderLogEntry(log) {
    const row = document.createElement('tr');
    row.className = `log-row log-row-${log.attack_type}`;
    row.innerHTML = `
      <td>${formatTime(new Date(log.timestamp))}</td>
      <td>${escapeHtml(log.attack_type)}</td>
      <td><code>${escapeHtml(String(log.id))}</code></td>
      <td><code>${escapeHtml(String(log.payload))}</code></td>
      <td>${escapeHtml(String(log.frequency))}</td>
      <td><span class="status-badge">${escapeHtml(log.status)}</span></td>
    `;

    // Remove "No events" message if exists
    const emptyRow = this.logBody.querySelector('.log-empty');
    if (emptyRow) {
      emptyRow.remove();
    }

    this.logBody.appendChild(row);

    // Keep only last N rows in DOM to prevent memory issues
    const rows = this.logBody.querySelectorAll('tr');
    if (rows.length > 500) {
      rows[0].remove();
    }
  }

  /**
   * Filter logs
   */
  filterLogs(type) {
    // Clear current display
    this.logBody.innerHTML = '';
    this.displayedLogIds.clear();

    // Filter and render
    if (!type || type === '') {
      this.filteredLogs = [...this.logs];
    } else {
      this.filteredLogs = this.logs.filter((log) => log.attack_type === type);
    }

    // Render last N filtered logs
    const startIndex = Math.max(0, this.filteredLogs.length - this.logBufferSize);
    for (let i = startIndex; i < this.filteredLogs.length; i++) {
      const log = this.filteredLogs[i];
      this.renderLogEntry(log);
      this.displayedLogIds.add(log.id);
    }

    if (this.filteredLogs.length === 0) {
      this.logBody.innerHTML = '<tr class="log-empty"><td colspan="6">No events...</td></tr>';
    }

    this.updateLogCount();
  }

  /**
   * Update log count display
   */
  updateLogCount() {
    this.logCount.textContent = formatNumber(this.logs.length);
    this.displayedCount.textContent = formatNumber(this.filteredLogs.length);
  }

  /**
   * Scroll log to bottom
   */
  scrollLogToBottom() {
    setTimeout(() => {
      this.logTable.scrollLeft = 0; // Reset horizontal scroll
      const wrapper = this.logTable.parentElement;
      wrapper.scrollTop = wrapper.scrollHeight;
    }, 0);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    if (!confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      return;
    }

    this.logs = [];
    this.filteredLogs = [];
    this.displayedLogIds.clear();
    this.logBody.innerHTML = '<tr class="log-empty"><td colspan="6">No events...</td></tr>';
    this.updateLogCount();

    showNotification('Logs cleared', 'success');
  }

  /**
   * Export logs as CSV
   */
  exportLogs() {
    if (this.logs.length === 0) {
      showNotification('No logs to export', 'warning');
      return;
    }

    const headers = ['Timestamp', 'Attack Type', 'CAN ID', 'Payload', 'Frequency', 'Status'];
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.attack_type,
      log.id,
      log.payload,
      log.frequency,
      log.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    downloadCSV(csv, `can-attack-logs-${Date.now()}.csv`);
    showNotification('Logs exported', 'success');
  }

  /**
   * Get current attack parameters
   */
  getCurrentAttackParams() {
    const type = this.attackType.value;

    switch (type) {
      case 'spoofing':
        return {
          type,
          params: {
            id: this.spoofId.value,
            payload: this.spoofPayload.value,
            frequency: parseInt(this.spoofFreq.value),
            intensity: parseInt(this.spoofIntensity.value),
          },
        };

      case 'dos':
        return {
          type,
          params: {
            frequency: parseInt(this.dosFreq.value),
            intensity: parseInt(this.dosIntensity.value),
            payload: this.dosPayload.value || undefined,
          },
        };

      case 'fuzzing':
        return {
          type,
          params: {
            fuzz_mode: this.fuzzMode.value,
            min_id: this.fuzzMinId.value,
            max_id: this.fuzzMaxId.value,
            payload_mode: this.fuzzPayloadMode.value,
            frequency: parseInt(this.fuzzFreq.value),
            intensity: parseInt(this.fuzzIntensity.value),
          },
        };

      default:
        return null;
    }
  }

  /**
   * Update live parameter status
   */
  updateParamStatus(message) {
    this.paramsStatus.textContent = message;
  }

  /**
   * Increment injection counter
   */
  incrementCounter() {
    const current = parseInt(this.injectionCounter.textContent);
    this.injectionCounter.textContent = formatNumber(current + 1);
  }

  /**
   * Reset injection counter
   */
  resetCounter() {
    this.injectionCounter.textContent = '0';
  }
}

// Global UI manager
const uiManager = new UIManager();
