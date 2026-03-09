# CAN Attack Control Dashboard

A modular, real-time CAN attack control system with WebSocket communication between a Node.js backend server and an ESP32 device.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Edge)
- ESP32 board (for actual injection)

### 2. Setup & Execution
**Windows:**
- Double-click `START_SERVER.bat` in the root folder.

**Manual (All OS):**
```bash
cd backend
npm install
npm start
```

### 3. Access Dashboard
- Open: `http://localhost:3000/login`
- **Default Password:** `admin@123`
- *Change this password in `backend/src/config.js` for production!*

---

## 📂 Project Structure

```
├── backend/                  # Node.js Express Server
│   ├── src/                 # Application Source
│   │   ├── controllers/      # Route logic (Auth, Logs, Status)
│   │   ├── routes/           # API and View definitions
│   │   ├── services/         # Core business logic (WebSocket Service)
│   │   ├── utils/            # Shared utilities (Logger, Validators)
│   │   ├── app.js            # Express app configuration
│   │   └── config.js         # Server constants and limits
│   ├── logs/                # Server-side runtime logs
│   ├── server.js            # Main entry point
│   └── package.json         # Backend dependencies
│
├── frontend/                 # Web Interface
│   ├── css/                 # Stylesheets (Dark theme)
│   ├── js/                  # JavaScript
│   │   ├── modules/          # ES6 Modules (UI, Socket, Auth, Utils)
│   │   ├── main.js           # Dashboard entry point
│   │   └── login.js          # Login page entry point
│   ├── index.html           # Main Dashboard
│   └── login.html           # Authentication Page
│
├── ESP32_INTEGRATION/        # ESP32 Firmware
│   └── ESP32_INTEGRATION.ino # Arduino source code
│
└── README.md                 # Project documentation
```

---

## 🔧 Core Features

- **Modular Architecture**: Professional code structure with separation of concerns.
- **Real-time WebSockets**: Instant status updates and low-latency command delivery.
- **Three Attack Vectors**: 
  - **Spoofing**: Targeted ID injection with custom payloads.
  - **DoS**: High-frequency bus flooding (0x000 override).
  - **Fuzzing**: Randomized ID and payload testing with multiple modes.
- **Live Parameter Control**: Update frequency, IDs, and intensities during an active attack.
- **Advanced Logging**: Real-time event streaming with CSV export functionality.
- **Enhanced Security**: Enhanced error logging, password protection, and input validation.

---

## 📡 ESP32 Integration

The dashboard is designed to connect to an ESP32 acting as a CAN injection engine.

1.  **WiFi Setup**: Update SSID and password in `ESP32_INTEGRATION.ino`.
2.  **Server IP**: The server will log its local IP on startup. Update `serverIP` in the `.ino` file to match.
3.  **Deployment**: Upload the sketch to your ESP32. It will automatically connect to the dashboard via WebSocket.

---

## 🔐 Security & Optimization

> [!IMPORTANT]
> Change the default password in `backend/src/config.js` before exposing the server to a network.

- **Network Exposure**: The server binds to `0.0.0.0` to allow local network access. Ensure your firewall allows incoming traffic on port `3000`.
- **Log Management**: The backend maintains the last 1000 events in memory; the frontend renders logs in optimized batches to prevent browser lag.
- **Error Resilience**: Automatic WebSocket reconnection with exponential backoff and centralized server-side logging.

---

## 🛠️ Performance Tuning

- **Log Buffer**: Adjust `LOG_BUFFER_SIZE` in `frontend/js/modules/config.js` if experiencing UI lag.
- **Memory**: Max logs can be configured in `backend/src/config.js`.

---

**Version:** 2.0.0 (Modularized)
**Status:** Production Ready
**Built for:** Security testing and CAN network analysis.
