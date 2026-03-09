#include "websocket_client.h"

WebSocketsClient webSocket;

const char *serverIP = "192.168.0.8";
const uint16_t serverPort = 3000;

unsigned long lastHeartbeat = 0;

void connectToServer()
{
  Serial.println("[WebSocket] Connecting to " + String(serverIP) + ":" + String(serverPort));

  webSocket.setReconnectInterval(3000);
  webSocket.setExtraHeaders("User-Agent: ESP32-CAN");

  webSocket.begin(serverIP, serverPort, "/");
  webSocket.onEvent(onWebSocketEvent);
}

void onWebSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
  switch (type)
  {
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

void handleWebSocketMessage(char *payload, size_t length)
{
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload);

  if (error)
  {
    Serial.println("[JSON] Parse error: " + String(error.c_str()));
    return;
  }

  const char *type = doc["type"];

  if (strcmp(type, "start_attack") == 0)
  {
    handleStartAttack(doc);
  }
  else if (strcmp(type, "stop_attack") == 0)
  {
    handleStopAttack();
  }
  else if (strcmp(type, "pause_attack") == 0)
  {
    handlePauseAttack();
  }
  else if (strcmp(type, "resume_attack") == 0)
  {
    handleResumeAttack();
  }
  else if (strcmp(type, "kill") == 0)
  {
    handleEmergencyKill();
  }
  else if (strcmp(type, "update_frequency") == 0)
  {
    currentParams.frequency = doc["frequency"];
    sendLogEvent("frequency_updated", 0, "", currentParams.frequency);
  }
  else if (strcmp(type, "update_id") == 0)
  {
    currentParams.id = doc["id"].as<String>();
    sendLogEvent("id_updated", 0, "", currentParams.frequency);
  }
  else if (strcmp(type, "update_payload") == 0)
  {
    currentParams.payload = doc["payload"].as<String>();
    sendLogEvent("payload_updated", 0, "", currentParams.frequency);
  }
  else if (strcmp(type, "update_intensity") == 0)
  {
    currentParams.intensity = doc["intensity"];
    sendLogEvent("intensity_updated", 0, "", currentParams.frequency);
  }
  else
  {
    Serial.println("[WebSocket] Unknown message type: " + String(type));
  }
}

void sendHeartbeat()
{
  JsonDocument doc;
  doc["type"] = "heartbeat";
  doc["status"] = "ready";

  String json;
  serializeJson(doc, json);

  webSocket.sendTXT(json);
}

void sendLogEvent(const char *event, uint32_t canId, String payload, uint16_t frequency)
{
  JsonDocument doc;
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