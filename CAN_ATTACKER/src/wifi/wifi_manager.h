#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>

// WiFi credentials
extern const char* ssid;
extern const char* password;

// Function to connect ESP32 to WiFi
void connectToWiFi();

#endif