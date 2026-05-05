/*
 * トマト栽培モニター — ESP32 + 静電容量式土壌水分センサー × 3
 *
 * 動作:
 *   1. WiFi に接続
 *   2. 3 本のセンサーから raw 値を読む (平均化)
 *   3. DRY/WET の校正値から moisture_pct を計算
 *   4. backend に POST /api/readings (JSON 形式)
 *   5. ディープスリープで INTERVAL_MS だけ待つ
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// センサーの GPIO ピン (ADC1: WiFi と併用可能)
const int SENSOR_PINS[3] = {34, 35, 32};

// 1 回の測定で何回サンプリングして平均するか
const int SAMPLE_COUNT = 16;

// raw → moisture_pct 変換 (DRY=0%, WET=100% にマッピング)
float convertToMoisturePct(int raw, int dry, int wet) {
  if (dry == wet) return 0.0;
  float pct = (float)(dry - raw) * 100.0 / (float)(dry - wet);
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

// 1 ピンを SAMPLE_COUNT 回読んで平均
int readSensorAvg(int pin) {
  long sum = 0;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    sum += analogRead(pin);
    delay(2);
  }
  return sum / SAMPLE_COUNT;
}

// WiFi 接続 (タイムアウト 15 秒)
bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > 15000) {
      Serial.println(" timeout");
      return false;
    }
    delay(500);
    Serial.print(".");
  }
  Serial.print(" OK ");
  Serial.println(WiFi.localIP());
  return true;
}

// バックエンドに送信
bool postReadings(int rawValues[3], float pctValues[3]) {
  // JSON ボディを組み立てる
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  JsonArray readings = doc.createNestedArray("readings");
  for (int i = 0; i < 3; i++) {
    JsonObject r = readings.createNestedObject();
    r["sensor_index"] = i;
    r["raw"] = rawValues[i];
    r["moisture_pct"] = pctValues[i];
  }
  String body;
  serializeJson(doc, body);
  Serial.println("POST body: " + body);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  Serial.printf("HTTP response: %d\n", code);
  if (code > 0) {
    Serial.println(http.getString());
  }
  http.end();
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== Tomato Sensor Wake Up ===");

  // ADC は 3.3V 上限を有効に
  analogReadResolution(12);     // 0..4095
  analogSetAttenuation(ADC_11db);

  // 3 本読む
  int   rawValues[3];
  float pctValues[3];
  for (int i = 0; i < 3; i++) {
    rawValues[i] = readSensorAvg(SENSOR_PINS[i]);
    pctValues[i] = convertToMoisturePct(rawValues[i], DRY_VALUES[i], WET_VALUES[i]);
    Serial.printf("Sensor %d: raw=%d  pct=%.1f%%\n",
                  i, rawValues[i], pctValues[i]);
  }

  // WiFi 接続して送信
  if (connectWiFi()) {
    postReadings(rawValues, pctValues);
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
  }

  // ディープスリープへ
  Serial.printf("Sleeping for %lu ms\n", (unsigned long)INTERVAL_MS);
  Serial.flush();
  esp_sleep_enable_timer_wakeup((uint64_t)INTERVAL_MS * 1000ULL);
  esp_deep_sleep_start();
}

void loop() {
  // deep sleep 後は setup() から再実行されるので、loop は使わない
}
