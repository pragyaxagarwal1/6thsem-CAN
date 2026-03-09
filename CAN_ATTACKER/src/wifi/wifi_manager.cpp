#include "wifi_manager.h"

const char* ssid = "ACT-ai_102694247778";
const char* password = "69742966";

String getWiFiStatus(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS: return "IDLE";
    case WL_NO_SSID_AVAIL: return "NO SSID AVAILABLE";
    case WL_SCAN_COMPLETED: return "SCAN COMPLETED";
    case WL_CONNECTED: return "CONNECTED";
    case WL_CONNECT_FAILED: return "CONNECTION FAILED";
    case WL_CONNECTION_LOST: return "CONNECTION LOST";
    case WL_DISCONNECTED: return "DISCONNECTED";
    default: return "UNKNOWN";
  }
}

void connectToWiFi() {
  Serial.println("[WiFi] Initializing WiFi...");
  
  // Ensure we start from a clean state
  WiFi.disconnect(true);
  delay(1000);
  
  Serial.println("[WiFi] Connecting to SSID: " + String(ssid));
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 60) {
    delay(500);
    Serial.print(".");
    if (attempts % 10 == 0 && attempts > 0) {
      Serial.print(" [Status: " + getWiFiStatus(WiFi.status()) + "] ");
    }
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.println("[WiFi] IP Address: " + WiFi.localIP().toString());
    Serial.println("[WiFi] RSSI: " + String(WiFi.RSSI()) + " dBm");
  } else {
    Serial.println("\n[WiFi] ERROR: Connection failed after 30 seconds");
    Serial.println("[WiFi] Final Status: " + getWiFiStatus(WiFi.status()));
    Serial.print("[WiFi] Please verify your credentials: SSID='");
    Serial.print(ssid);
    Serial.println("'");
  }
}