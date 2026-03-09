#include "wifi/wifi_manager.h"
#include "network/websocket_client.h"
#include "can/can_driver.h"
#include "attacks/attack_control.h"

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("ESP32 CAN Injection Engine");
  Serial.println("========================================");

  // Initialize CAN
  initCAN();

  // Connect to WiFi
  connectToWiFi();

  // Connect to WebSocket
  connectToServer();
}

void loop() {
  webSocket.loop();

  // Send heartbeat every 2 seconds
  if (millis() - lastHeartbeat >= 2000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  // Execute attack if running
  if (attackRunning) {
    executeAttack();
  }

  delay(10);
}



// ==========================================
// NOTES FOR COMPILATION
// ==========================================

/*
Required Libraries (install via Arduino IDE):
- WebSockets by Markus Sattler (v2.4.0+)
- ArduinoJson by Benoit Blanchon (v6.19.0+)

ESP32 Board: ESP32 Dev Module or equivalent

Pin Configuration:
- CAN TX: GPIO 5 (adjust based on your hardware)
- CAN RX: GPIO 4 (adjust based on your hardware)

Compilation Instructions:
1. Select board: Tools > Board > ESP32 Arduino > ESP32 Dev Module
2. Select Port: Tools > Port > (your COM port)
3. Adjust WiFi SSID, password, and server IP
4. Compile and upload

Troubleshooting:
- If CAN fails to initialize, check GPIO pins
- If WebSocket fails, verify server IP and port
- Check Serial Monitor (115200 baud) for debug output
*/
