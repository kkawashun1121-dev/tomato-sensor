/*
 * 設定テンプレート — このファイルを config.h にコピーして書き換えてください
 *
 * config.h は .gitignore で除外されています (パスワード保護のため)
 */
#pragma once

// WiFi
#define WIFI_SSID      "192.168.0.139"
#define WIFI_PASSWORD  "NktgtdtcLfWrA"

// バックエンド URL
//   Docker で立てた backend が PC で 8001 ポートに公開されているなら
//   PC の LAN IP を使う (例: 192.168.1.10)
//   ESP32 と PC が同じ Wi-Fi に接続している必要あり

#define SERVER_URL     "http://192.168.0.139:8001/api/readings"

// このデバイスを区別する ID (複数台運用したい時のため)
#define DEVICE_ID      "esp32-01"

// 校正値: 空気中で測った raw 値 (=0% の基準)
//   実機で測ってから書き換え (測定方法は後述)
const int DRY_VALUES[3] = {2160,2380,2025};

// 校正値:実際の苗で6Lの水を入れたときの raw 値 (=100% の基準)
const int WET_VALUES[3] = {1655, 1475, 1515};

// 測定間隔 (ミリ秒) — 15 分 = 15*60*1000 = 900000
//#define INTERVAL_MS    900000UL (本番用 コメントアウト中)
#define INTERVAL_MS    900000UL    // 30 秒に変更 (校正用)


#define WIFI_SSID      "KAONM-F89FD-G"
#define WIFI_PASSWORD  "NktgtdtcLfWrA"