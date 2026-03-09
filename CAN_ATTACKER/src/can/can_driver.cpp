#include "can_driver.h"

const int canTxPin = 5;
const int canRxPin = 4;

void initCAN() {
  Serial.println("[CAN] Initializing CAN bus...");

  twai_general_config_t g_config = TWAI_GENERAL_CONFIG_DEFAULT(GPIO_NUM_5,GPIO_NUM_4, TWAI_MODE_NORMAL);
  twai_timing_config_t t_config = TWAI_TIMING_CONFIG_500KBITS();
  twai_filter_config_t f_config = TWAI_FILTER_CONFIG_ACCEPT_ALL();

  if (twai_driver_install(&g_config, &t_config, &f_config) == ESP_OK) {
    Serial.println("[CAN] Driver installed successfully");
  } else {
    Serial.println("[CAN] ERROR: Failed to install driver");
    return;
  }

  if (twai_start() == ESP_OK) {
    Serial.println("[CAN] Driver started successfully");
  } else {
    Serial.println("[CAN] ERROR: Failed to start driver");
  }
}

bool CAN_Send(uint32_t id, uint8_t *data, uint8_t dlc)
{
    twai_message_t msg;

    msg.identifier = id;
    msg.flags = TWAI_MSG_FLAG_NONE;
    msg.data_length_code = dlc;

    memcpy(msg.data, data, dlc);

    return (twai_transmit(&msg, pdMS_TO_TICKS(10)) == ESP_OK);
}