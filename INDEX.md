# Welcome to CAN Attack Control Dashboard

## 🚀 Get Started NOW (2 Steps)

### Step 1: Install Node.js
Download from: https://nodejs.org/ (v14 or higher)

### Step 2: Start the Server

**Windows Users:**
- Double-click `START_SERVER.bat` in this folder

**Mac/Linux Users:**
```bash
cd backend
npm install
npm start
```

The dashboard will start on: **http://localhost:3000/login**

---

## 📖 Documentation

Start here based on your needs:

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[QUICKSTART.md](QUICKSTART.md)** | 5-minute setup guide | 5 min |
| **[README.md](README.md)** | Complete documentation | 15 min |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | What was built | 10 min |

---

## 🔓 Login Credentials

```
Password: admin@123
```

⚠️ **Change this password in production!**

---

## 📂 Project Structure

```
├── backend/              # Node.js server
│   ├── server.js        # Main server
│   ├── websocket-handler.js
│   ├── validators.js
│   ├── config.js
│   └── package.json
│
├── frontend/            # Dashboard UI
│   ├── index.html
│   ├── login.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       ├── ui.js
│       ├── websocket-client.js
│       ├── auth.js
│       └── utils.js
│
├── ESP32_INTEGRATION.ino # Sample ESP32 firmware
└── Documentation files
```

---

## ⚙️ What You Get

✅ **Real-time Dashboard** - Monitor ESP32 in real-time
✅ **3 Attack Types** - Spoofing, DoS, Fuzzing
✅ **Live Controls** - Start/Stop/Pause attacks
✅ **Parameter Updates** - Change settings without restart
✅ **Event Logging** - Stream and export injection logs
✅ **Secure Access** - Password-protected login
✅ **Dark Theme UI** - Professional cybersecurity design
✅ **Complete Documentation** - 20+ pages of guides

---

## 🎯 Dashboard Panels

### 1. Connection Status
- ESP32 connection state
- WebSocket latency
- Reconnect button
- Log export/clear

### 2. Attack Control
- Select attack type
- Configure parameters
- Start/Stop/Pause controls
- Emergency Kill button
- Injection counter

### 3. Live Parameters
- Update frequency (Hz)
- Change CAN ID
- Modify payload
- Adjust intensity

### 4. Injection Logs
- Real-time event stream
- Filter by attack type
- Export as CSV
- Auto-scroll toggle

---

## 🔧 Attack Types

### Spoofing
Send specific CAN messages repeatedly

```
ID: 0x123
Payload: AABBCCDDEEFF1122
Frequency: 1-2000 Hz
```

### DoS (Denial of Service)
Flood CAN bus with high-frequency traffic

```
Frequency: 500-5000 Hz
Optional custom payload
```

### Fuzzing
Send random CAN messages

```
Mode: Random ID, Payload, or Both
Frequency: 1-2000 Hz
```

---

## 📡 Integration

### For ESP32 Developers

1. Use the provided [ESP32_INTEGRATION.ino](ESP32_INTEGRATION.ino)
2. Set WiFi SSID and password
3. Set server IP address
4. Upload to ESP32
5. Dashboard will auto-connect

Required libraries:
- WebSockets by Markus Sattler
- ArduinoJson by Benoit Blanchon

---

## 🔐 Security

- Password-protected login
- Input validation on all messages
- CAN ID range checking (0x000-0x7FF)
- Payload format verification
- Single device connection limit
- Session timeout (24 hours)

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Kill other process on port 3000 |
| Node.js not found | Install from https://nodejs.org/ |
| WebSocket fails | Check firewall, allow port 3000 |
| Dashboard not loading | Check browser console, clear cache |
| ESP32 won't connect | Verify WiFi, check server IP |

For more help, see [QUICKSTART.md](QUICKSTART.md)

---

## 📊 Features at a Glance

```
✅ WebSocket Real-time Communication
✅ Single ESP32 Connection Management
✅ Heartbeat Monitoring (2 sec interval)
✅ Latency Measurement (Ping/Pong)
✅ Three Attack Types (Spoofing/DoS/Fuzzing)
✅ Dynamic Parameter Control
✅ Live Event Streaming
✅ CSV Export
✅ Dark Theme UI
✅ Responsive Design
✅ Error Recovery
✅ Auto-reconnection
✅ Message Validation
✅ Security Features
```

---

## 📈 System Requirements

- **Node.js** v14+ (Download: https://nodejs.org/)
- **Modern Browser** (Chrome, Firefox, Edge, Safari)
- **ESP32 Board** (for actual injection - optional for testing)
- **WiFi Connection** (for ESP32)

---

## 🎓 Learning Outcomes

This project demonstrates:
- WebSocket real-time communication
- Node.js backend architecture
- Modern JavaScript (ES6+)
- DOM manipulation and optimization
- Authentication and sessions
- CAN bus protocol basics
- Error handling and recovery
- Responsive UI design

---

## 📝 Files Overview

| File | Purpose | Lines |
|------|---------|-------|
| server.js | Express + WebSocket server | 350 |
| websocket-handler.js | Connection & message handling | 350 |
| validators.js | Input validation | 280 |
| config.js | Configuration constants | 90 |
| index.html | Dashboard page | 250 |
| login.html | Login page | 150 |
| styles.css | Dark theme CSS | 800+ |
| app.js | Main controller | 400 |
| ui.js | UI manager | 450 |
| websocket-client.js | WebSocket wrapper | 250 |
| auth.js | Authentication | 70 |
| utils.js | Helper functions | 300 |

---

## 🚀 Next Steps

1. **Install Node.js** from https://nodejs.org/

2. **Start the server:**
   - Windows: Double-click `START_SERVER.bat`
   - Mac/Linux: Run `cd backend && npm install && npm start`

3. **Open dashboard:** http://localhost:3000/login

4. **Login with:** password `admin@123`

5. **Read documentation** to understand features

6. **Integrate ESP32** using the provided firmware

---

## 📞 Support

For questions or issues:
1. Check [QUICKSTART.md](QUICKSTART.md) for quick answers
2. Review [README.md](README.md) for detailed documentation
3. Check browser console (F12) for errors
4. Verify firewall allows port 3000
5. Test with: `curl http://localhost:3000/api/health`

---

## ✨ Key Features

🔹 **Real-time**: WebSocket for instant updates
🔹 **Secure**: Password protected with validation
🔹 **Flexible**: Three different attack types
🔹 **Live**: Update parameters without restart
🔹 **Monitored**: Complete event logging and export
🔹 **Beautiful**: Dark theme cybersecurity UI
🔹 **Reliable**: Auto-reconnection and error recovery
🔹 **Documented**: 20+ pages of documentation

---

**Version:** 1.0
**Status:** ✅ Production Ready
**Last Updated:** February 28, 2026

Start with [QUICKSTART.md](QUICKSTART.md) →
