#ifndef ATTACK_CONTROL_H
#define ATTACK_CONTROL_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "network/websocket_client.h"
#include "can/can_driver.h"
// ==========================================
// GLOBAL ATTACK STATE
// ==========================================

extern bool attackRunning;
extern String currentAttackType;
extern unsigned long injectionCounter;

// ==========================================
// ATTACK PARAMETERS STRUCT
// ==========================================

struct AttackParams {
    String id;
    String payload;
    uint16_t frequency;
    uint8_t intensity;
    String fuzzMode;
    String minId;
    String maxId;
    String payloadMode;
};

extern AttackParams currentParams;

// ==========================================
// ATTACK CONTROL FUNCTIONS
// ==========================================

void handleStartAttack(JsonDocument &doc);
void handleStopAttack();
void handlePauseAttack();
void handleResumeAttack();
void handleEmergencyKill();

// ==========================================
// ATTACK EXECUTION
// ==========================================

void executeAttack();

// ==========================================
// ATTACK IMPLEMENTATIONS (other modules)
// ==========================================

void executeSpoofing();
void executeDOS();
void executeFuzzing();

#endif