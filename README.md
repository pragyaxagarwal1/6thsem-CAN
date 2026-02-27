# CAN Attack Control Dashboard

A complete real-time CAN attack control system with WebSocket communication between a Node.js backend server and an ESP32 device.

## Overview

This project provides a professional-grade dashboard for controlling and monitoring CAN (Controller Area Network) injection attacks. It features:

- **Real-time WebSocket Communication**: Instant status updates and command delivery
- **Three Attack Types**: Spoofing, DoS (Denial of Service), and Fuzzing
- **Live Parameter Control**: Update attack parameters without restarting
- **Comprehensive Logging**: Stream and export injection events
- **Secure Authentication**: Password-protected dashboard access
- **Dark Theme UI**: Modern, cybersecurity-oriented design
- **Device Management**: Single ESP32 connection with heartbeat monitoring
- **Latency Measurement**: Real-time ping/pong latency tracking

## System Architecture

```
┌─────────────────────────────────────┐
│          Frontend Dashboard          │
│  (HTML + CSS + Vanilla JavaScript)   │
│   - 4 Panel Layout                   │
│   - Real-time WebSocket Updates      │
│   - Dark Theme UI                    │
└──────────────────┬──────────────────┘
                   │
              WebSocket
                   │
┌──────────────────▼──────────────────┐
│      Node.js Backend Server         │
│      (Express + WebSocket)          │
│   - Port 3000                        │
│   - Message Validation               │
│   - Connection Management            │
│   - Heartbeat Monitoring             │
│   - Log Storage & Export             │
└──────────────────┬──────────────────┘
                   │
              WebSocket
                   │
┌──────────────────▼──────────────────┐
│        ESP32 CAN Injection Engine    │
│      (Arduino/MicroPython)           │
│   - Executes CAN Injections          │
│   - Sends Heartbeat (2 sec)          │
│   - Streams Log Events               │
│   - Handles Emergency Kill           │
└─────────────────────────────────────┘
```

## Project Structure

```
project-root/
├── backend/
│   ├── server.js              # Main Express + WebSocket server
│   ├── websocket-handler.js   # WebSocket connection logic
│   ├── validators.js          # Message validation utilities
│   ├── config.js              # Configuration constants
│   └── package.json           # Node.js dependencies
│
├── frontend/
│   ├── index.html             # Dashboard page
│   ├── login.html             # Login page
│   ├── css/
│   │   └── styles.css         # Dark theme styles
│   └── js/
│       ├── app.js             # Main application controller
│       ├── ui.js              # UI manager & DOM updates
│       ├── websocket-client.js # WebSocket client wrapper
│       ├── auth.js            # Authentication manager
│       └── utils.js           # Utility functions
│
└── README.md                  # This file
```

## Installation

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Edge, Safari)
- ESP32 board with WiFi capability (for actual injection)

### Backend Setup

1. **Install Dependencies**

```bash
cd backend
npm install
```

This will install:
- `express` - Web framework
- `ws` - WebSocket library
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

2. **Configure Backend**

Create a `.env` file in the backend directory (optional):

```env
PORT=3000
LOGIN_PASSWORD=admin@123
```

The default password is `admin@123`. Change this for production!

3. **Start Backend Server**

```bash
npm start
```

You should see:

```
╔════════════════════════════════════════════════╗
║   CAN Attack Control Dashboard - Backend       ║
╚════════════════════════════════════════════════╝

✓ Server running on http://localhost:3000
✓ WebSocket server ready on ws://localhost:3000
✓ Frontend available at http://localhost:3000

Configuration:
  - Login password: admin@123
  - Max logs in memory: 1000
  - Heartbeat interval: 2000ms
  - Heartbeat timeout: 5000ms

Ready to accept ESP32 connections...
```

### Frontend Access

Open your browser and navigate to:

```
http://localhost:3000/login
```

**Default Credentials:**
- Password: `admin@123`

## Dashboard Panels

### 1. Connection Status Panel

Monitor ESP32 connection state:

- **ESP32 Status**: Connected/Not Connected indicator
- **WebSocket State**: Connection state display
- **Ping Latency**: Real-time latency measurement
- **Connected Clients**: Number of connected dashboard users

**Actions:**
- `Reconnect` - Force WebSocket reconnection
- `Clear Logs` - Clear all event logs
- `Export CSV` - Download logs as CSV file

### 2. Attack Control Panel

Configure and execute CAN injection attacks:

#### Spoofing Attack
- **CAN ID**: Target CAN identifier (0x000 - 0x7FF hex)
- **Payload**: 8-byte data (16 hex chars with spaces)
- **Frequency**: 1-2000 Hz injection rate
- **Intensity**: 1-100 aggressiveness level

#### DoS (Denial of Service)
- **CAN ID**: Fixed to 0x000
- **Payload**: Optional custom data
- **Frequency**: 500-5000 Hz (high frequency attack)
- **Intensity**: 1-100 attack intensity

#### Fuzzing
- **Fuzz Mode**: Random ID, Random Payload, or Both
- **Min/Max ID**: ID range for fuzzing
- **Payload Mode**: Random or Incremental
- **Frequency**: 1-2000 Hz
- **Intensity**: 1-100 fuzzing intensity

**Control Buttons:**
- `Start Attack` - Begin injection attack
- `Stop Attack` - Halt active attack
- `Pause` - Pause attack (resume later)
- `Resume` - Continue paused attack
- `Emergency Kill` - Immediate stop (red button)

**Live Counter:**
- Shows number of injections sent during active attack

### 3. Live Parameter Control Panel

Update attack parameters in real-time without restarting:

- **Update Frequency**: Change injection rate (Hz)
- **Update CAN ID**: Modify target identifier
- **Update Payload**: Change data being injected
- **Update Intensity**: Adjust aggressiveness

These changes are applied immediately to the running attack.

### 4. Injection Log Panel

Real-time event streaming with filtering:

**Columns:**
- **Timestamp**: Event time
- **Type**: Attack type (spoofing/dos/fuzzing)
- **CAN ID**: Message identifier
- **Payload**: Injected data
- **Frequency**: Injection rate
- **Status**: Operation status

**Features:**
- **Filter**: Show logs by attack type
- **Auto-scroll**: Automatically scroll to latest events
- **Stats**: Total and displayed event count
- **Buffered Rendering**: Prevents UI lag with high-frequency events

## WebSocket Message Protocol

### Client → Server (Frontend)

#### Start Attack

```json
{
  "type": "start_attack",
  "attack_type": "spoofing",
  "parameters": {
    "id": "0x123",
    "payload": "AABBCCDDEEFF1122",
    "frequency": 500,
    "intensity": 50
  }
}
```

#### Stop Attack

```json
{
  "type": "stop_attack"
}
```

#### Pause/Resume

```json
{
  "type": "pause_attack"
}
```

```json
{
  "type": "resume_attack"
}
```

#### Emergency Kill

```json
{
  "type": "kill"
}
```

#### Update Parameters

```json
{
  "type": "update_frequency",
  "frequency": 1000
}
```

```json
{
  "type": "update_id",
  "id": "0x456"
}
```

```json
{
  "type": "update_payload",
  "payload": "11223344556677FF"
}
```

```json
{
  "type": "update_intensity",
  "intensity": 75
}
```

### Server → Client (Frontend)

#### Status Update

```json
{
  "type": "status_update",
  "esp32_connected": true,
  "attack_running": true,
  "latency": 15,
  "current_attack": {
    "type": "spoofing",
    "parameters": { ... },
    "startTime": "2026-02-28T10:30:00Z"
  }
}
```

#### Log Event (from ESP32)

```json
{
  "type": "log_event",
  "timestamp": "2026-02-28T10:30:15Z",
  "attack_type": "spoofing",
  "id": "0x123",
  "payload": "AABBCCDDEEFF1122",
  "frequency": 500,
  "status": "sent"
}
```

### ESP32 → Server

#### Heartbeat (every 2 seconds)

```json
{
  "type": "heartbeat",
  "status": "ready"
}
```

#### Log Event

```json
{
  "type": "log_event",
  "attack_type": "spoofing",
  "id": "0x123",
  "payload": "AABBCCDDEEFF1122",
  "frequency": 500,
  "status": "sent"
}
```

## Configuration

All configuration is in `backend/config.js`:

```javascript
// Heartbeat monitoring
HEARTBEAT_INTERVAL: 2000,    // 2 seconds
HEARTBEAT_TIMEOUT: 5000,     // 5 seconds

// CAN validation ranges
CAN_VALIDATION: {
  ID_MIN: 0x000,
  ID_MAX: 0x7FF,
  PAYLOAD_LENGTH: 8,
}

// Attack frequency limits
FREQUENCY_LIMITS: {
  SPOOFING: { MIN: 1, MAX: 2000 },
  DOS: { MIN: 500, MAX: 5000 },
  FUZZING: { MIN: 1, MAX: 2000 },
}

// Intensity limits
INTENSITY_LIMITS: {
  MIN: 1,
  MAX: 100,
}

// Login
LOGIN_PASSWORD: 'admin@123'
SESSION_TIMEOUT: 24 * 60 * 60 * 1000
```

## API Endpoints

### Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-28T10:30:00Z"
}
```

### Get Status

```
GET /api/status
```

Response:
```json
{
  "esp32_connected": true,
  "attack_running": false,
  "latency": 15,
  "current_attack": null,
  "connected_clients": 2
}
```

### Get Logs

```
GET /api/logs?limit=100&offset=0
```

Response:
```json
{
  "logs": [...],
  "total": 500,
  "limit": 100,
  "offset": 0
}
```

### Export Logs

```
GET /api/logs/export
```

Downloads CSV file with all logs.

### Login

```
POST /api/login
Content-Type: application/json

{
  "password": "admin@123"
}
```

Response:
```json
{
  "success": true,
  "token": "YWRtaW5AMTIz"
}
```

## ESP32 Integration

The ESP32 should:

1. **Connect to WiFi**
2. **Establish WebSocket connection** to `ws://<server_ip>:3000`
3. **Send heartbeat** every 2 seconds
4. **Listen for commands** (start_attack, stop_attack, kill, etc.)
5. **Send log events** after each injection
6. **Support parameter updates** in real-time

Example ESP32 sketch structure:

```cpp
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// Server IP and port
const char* serverIP = "192.168.1.100";
const int serverPort = 3000;

WebSocketsClient webSocket;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // Connect to WebSocket server
  webSocket.begin(serverIP, serverPort, "/");
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  
  // Send heartbeat every 2 seconds
  if (millis() % 2000 == 0) {
    sendHeartbeat();
  }
}

void sendHeartbeat() {
  DynamicJsonDocument doc(256);
  doc["type"] = "heartbeat";
  doc["status"] = "ready";
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_TEXT:
      handleMessage((char*)payload);
      break;
    case WStype_CONNECTED:
      Serial.println("WebSocket connected");
      break;
    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected");
      break;
  }
}

void handleMessage(char* payload) {
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, payload);
  
  const char* type = doc["type"];
  
  if (strcmp(type, "start_attack") == 0) {
    // Handle start attack
    const char* attackType = doc["attack_type"];
    // ... execute CAN injection
  } else if (strcmp(type, "kill") == 0) {
    // Emergency stop
  }
}
```

## Security Considerations

1. **Change Default Password**: Update `LOGIN_PASSWORD` in `.env`
2. **Network Security**: Deploy behind a firewall/VPN
3. **HTTPS/WSS**: Use SSL/TLS in production
4. **Input Validation**: All messages are validated server-side
5. **Single ESP32**: Only one device can connect at a time
6. **Session Timeout**: Dashboard sessions expire after 24 hours

## Performance Optimization

- **Log Buffering**: Logs are buffered and rendered in batches
- **DOM Batching**: Multiple DOM updates are batched to prevent reflows
- **Memory Management**: Limited to 1000 logs in memory (configurable)
- **WebSocket Reconnection**: Automatic with exponential backoff
- **Debounced Updates**: Status updates are throttled to prevent spam

## Troubleshooting

### WebSocket Connection Failed

```
Error: ECONNREFUSED
```

**Solution**: Ensure backend server is running on port 3000.

### Login Loop

**Solution**: Clear browser localStorage and try again:
```javascript
localStorage.clear();
location.reload();
```

### No ESP32 Connection

- Verify ESP32 is powered on
- Check WiFi connection on ESP32
- Verify server IP in ESP32 sketch
- Check firewall rules

### Slow Log Display

- Reduce log refresh rate
- Filter logs by attack type
- Clear old logs
- Reduce `logBufferSize` in `ui.js`

## Development

### Add New Attack Type

1. Add to `config.js`:
```javascript
ATTACK_TYPES: {
  NEW_ATTACK: 'new_attack'
}
```

2. Add validation in `validators.js`

3. Add UI panel in `index.html`

4. Handle in `app.js`

### Modify WebSocket Protocol

1. Update message format in `websocket-handler.js`
2. Add handler in `websocket-client.js`
3. Update ESP32 sketch accordingly

## Production Deployment

### Using PM2

```bash
npm install -g pm2

pm2 start backend/server.js --name "can-dashboard"
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY backend/ ./
RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]
```

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the WebSocket message format
3. Check browser console for errors
4. Check backend logs for validation errors

---

**CAN Attack Control Dashboard v1.0**
Built for security testing and CAN network analysis.
