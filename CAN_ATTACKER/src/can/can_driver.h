#pragma once
#include <driver/twai.h>
#include <Arduino.h>
void initCAN();
bool CAN_Send(uint32_t id, uint8_t *data, uint8_t dlc);