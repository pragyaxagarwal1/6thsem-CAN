# Quick Start Guide - CAN Attack Control Dashboard

## 🚀 Get Started in 5 Minutes

### Step 1: Install Node.js

Download and install from https://nodejs.org/ (v14 or higher)

### Step 2: Navigate to Backend Directory

```bash
cd backend
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `ws` - WebSocket library
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

### Step 4: Start the Backend Server

```bash
npm start
```

You should see:
```
✓ Server running on http://localhost:3000
✓ WebSocket server ready on ws://localhost:3000
✓ Ready to accept ESP32 connections...
```

### Step 5: Open Dashboard in Browser

Open your browser and go to:
```
http://localhost:3000/login
```

### Step 6: Login

**Default password:** `admin@123`

You should see the dashboard with 4 panels.

---

## 📋 Dashboard Overview

### Panel 1: Connection Status
- Shows ESP32 connection state
- Displays WebSocket status
- Shows ping latency
- Buttons to reconnect, clear logs, export CSV

### Panel 2: Attack Control
- Select attack type (Spoofing, DoS, Fuzzing)
- Configure attack parameters
- Start/Stop/Pause/Resume attacks
- Emergency Kill button for immediate stop
- Live injection counter

### Panel 3: Live Parameters
- Update frequency during attack
- Change CAN ID without restarting
- Modify payload on the fly
- Adjust intensity in real-time

### Panel 4: Injection Logs
- Stream of all injection events
- Filter by attack type
- Auto-scroll toggle
- CSV export functionality
- Event counter

---

## 🔧 Attack Types

### Spoofing
```
Target: Specific CAN ID
ID: 0x123
Payload: AABBCCDDEEFF1122
Frequency: 500 Hz
```

### DoS (Denial of Service)
```
Target: Fixed ID 0x000
Payload: Optional custom data
Frequency: 500-5000 Hz (high)
Effect: Floods CAN bus
```

### Fuzzing
```
Mode: Random ID, Payload, or Both
ID Range: 0x000 to 0x7FF
Payload: Random or Incremental
Frequency: 1-2000 Hz
```

---

## 🔐 Security Notes

1. **Change Default Password**
   ```bash
   # Edit backend/.env
   LOGIN_PASSWORD=your_secure_password
   ```

2. **Use HTTPS in Production**
   - Add SSL/TLS certificates
   - Use WSS instead of WS

3. **Firewall**
   - Restrict access to port 3000
   - Only allow trusted IPs

4. **Network**
   - Keep ESP32 on isolated network
   - Don't expose to internet

---

## 📡 Connecting ESP32

Your ESP32 firmware should:

1. Connect to WiFi
2. Open WebSocket to `ws://<server_ip>:3000`
3. Send heartbeat every 2 seconds:
   ```json
   {"type": "heartbeat", "status": "ready"}
   ```
4. Listen for commands and respond with log events

See README.md for full ESP32 integration guide.

---

## 🐛 Common Issues

### Port 3000 Already in Use
```bash
# Kill process using port 3000
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000
```

### WebSocket Connection Failed
- Check if server is running
- Verify firewall allows port 3000
- Check browser console for errors

### ESP32 Not Connecting
- Verify WiFi credentials on ESP32
- Check server IP in ESP32 sketch
- Ensure ESP32 is powered on
- Check network connectivity

### Dashboard Not Loading
- Clear browser cache: Ctrl+Shift+Del
- Try incognito/private window
- Check if backend is running

---

## 📊 Monitoring

### Check Server Status
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{"status": "ok", "timestamp": "2026-02-28T10:30:00Z"}
```

### Get Current Status
```bash
curl http://localhost:3000/api/status
```

### Download Logs
```bash
curl http://localhost:3000/api/logs/export > logs.csv
```

---

## 🛑 Stop the Server

Press `Ctrl+C` in the terminal where server is running.

---

## 📚 Next Steps

1. Read full [README.md](README.md) for detailed documentation
2. Check WebSocket message format for API integration
3. Review validation rules for CAN messages
4. Set up ESP32 firmware with integration guide
5. Configure production deployment

---

**For production use, always:**
- Change default password
- Use HTTPS/WSS
- Configure firewall
- Monitor logs
- Keep software updated

Enjoy your CAN Attack Control Dashboard! 🎉
