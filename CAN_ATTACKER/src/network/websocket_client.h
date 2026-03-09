#ifndef WEBSOCKET_CLIENT_H
#define WEBSOCKET_CLIENT_H

#include <Arduino.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "attacks/attack_control.h"
#include "utils/logger.h"

extern WebSocketsClient webSocket;

extern const char* serverIP;
extern const uint16_t serverPort;

extern unsigned long lastHeartbeat;

void connectToServer();

void onWebSocketEvent(WStype_t type, uint8_t *payload, size_t length);

void handleWebSocketMessage(char *payload, size_t length);

void sendHeartbeat();
void sendLogEvent(const char *event, uint32_t canId, String payload, uint16_t frequency);

#endif