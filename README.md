# 🍅 トマト栽培モニター (Tomato Sensor System)

ESP32 + 静電容量式土壌水分センサー + FastAPI + PostgreSQL + React によるトマト栽培モニタリングシステム。

> 学籍番号 18124058 河村隼介 / 前期取り組み

---

## 概要

家庭でのトマト栽培における環境データを **自動収集 + 一元管理 + 可視化** するフルスタックシステム。

### 取得・記録するデータ

- **共通**: 天候・気温・湿度・日照時間 (Open-Meteo API から自動取得)
- **株単位**: 土壌水分量 (ESP32 から 15 分毎)、収穫個数、水やり履歴、最終丈
- **実単位**: 開花日、収穫日、糖度、実の高さ・直径・重量、画像
- **計算**: 開花からの累積日照時間

---

## 技術スタック

| 層 | 技術 |
|---|---|
| **マイコン** | ESP32 (Freenove ESP32 WROOM) + Arduino IDE |
| **センサー** | 静電容量式土壌水分センサー × 3 (GPIO34/35/32) |
| **バックエンド** | Python 3.12 + FastAPI 0.110 + SQLAlchemy 2.0 + Pydantic 2 |
| **データベース** | PostgreSQL 16 |
| **フロントエンド** | React 18 + Vite + Chart.js + react-chartjs-2 |
| **インフラ** | Docker Compose |
| **外部 API** | Open-Meteo (天気・気温・湿度・日照時間) |
| **自動化** | Windows タスクスケジューラ (毎時の天気取得) |

---

## システム構成

┌─────────────────┐
            │     ESP32       │  15分毎に WiFi 接続して
            │ + 土壌水分3本   │  POST /api/readings
            └────────┬────────┘
                     │ HTTP
                     ▼

┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│ Open-Meteo   │───▶│   FastAPI       │◀───│ React (Vite) │
│ (天気API)    │    │ + PostgreSQL    │    │ Dashboard    │
└──────────────┘    │   (Docker)      │    └──────────────┘
▲            └─────────────────┘
│
Python script (毎時自動実行)

## 主な機能

- **ダッシュボード** (React)
  - 各センサーの最新水分量 (リアルタイム色分け)
  - 期間別グラフ (24h / 7日 / 30日)
  - 環境データ (現在 + 履歴)
  - 株 / 実 の登録・編集・削除
  - 水やり / 収穫の履歴管理
  - 画像ギャラリー (アップロード・拡大表示)
- **計算ロジック**
  - 開花からの累積日照時間 (環境データと開花日から自動算出)
- **自動化**
  - ESP32 のディープスリープ (15 分毎にだけ起動)
  - Open-Meteo からの定時データ取得 (毎時)

---

## セットアップ

### 必要なもの

- Docker Desktop
- Node.js 20+
- Python 3.10+
- Arduino IDE 2.x (ESP32 開発時のみ)

### バックエンド + DB

```bash
git clone https://github.com/<yourname>/tomato-sensor.git
cd tomato-sensor
docker compose up -d --build
```

起動後の確認:
- API ドキュメント (Swagger): http://localhost:8001/docs
- ヘルスチェック: http://localhost:8001/healthz

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:5173/ (または 5174) を開く。

### ESP32 ファームウェア

1. Arduino IDE で `firmware/tomato_sensor_esp32/tomato_sensor_esp32.ino` を開く
2. ボード: **ESP32 Dev Module**
3. ライブラリ: **ArduinoJson** をインストール
4. `firmware/tomato_sensor_esp32/config.h.example` を `config.h` にコピーし、WiFi 情報と SERVER_URL (PC の LAN IP) を記入
5. 校正値 (`DRY_VALUES` / `WET_VALUES`) は実機で測定して書き込み
6. Upload (→ボタン) で書き込み

### 配線 (ESP32)

| センサー | VCC | GND | AOUT |
|---|---|---|---|
| Sensor 0 | 3V3 | GND | GPIO 34 |
| Sensor 1 | 3V3 | GND | GPIO 35 |
| Sensor 2 | 3V3 | GND | GPIO 32 |

> 注意: ADC2 系のピン (GPIO 0/2/4/12-15/25-27) は WiFi と競合するので NG。GPIO 34/35/32 は ADC1 系。

### 外部 API スクリプト

```bash
python scripts/fetch_weather.py
# 緯度経度を指定する場合
python scripts/fetch_weather.py --lat 35.68 --lon 139.69
```

Windows タスクスケジューラに登録すれば毎時自動取得可能。

---

## ディレクトリ構成

tomato-sensor/
├── backend/                 # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py          # アプリエントリ (CORS + lifespan)
│   │   ├── config.py        # 環境変数
│   │   ├── database.py      # SQLAlchemy 設定
│   │   ├── models.py        # ORM (7 テーブル)
│   │   ├── schemas.py       # Pydantic 入出力
│   │   ├── crud.py          # DB アクセス
│   │   └── routers/         # 各リソースのエンドポイント
│   │       ├── readings.py
│   │       ├── environments.py
│   │       ├── plants.py
│   │       ├── waterings.py
│   │       ├── harvests.py
│   │       ├── fruits.py
│   │       └── images.py
│   ├── data/images/         # 画像保存ディレクトリ (volume)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React + Vite フロント
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── SummaryCards.jsx
│   │   │   ├── EnvironmentPanel.jsx
│   │   │   ├── MoistureChart.jsx
│   │   │   ├── PlantManager.jsx
│   │   │   ├── FruitManager.jsx
│   │   │   └── ImageGallery.jsx
│   │   └── hooks/           # データ取得フック群
│   └── vite.config.js       # /api と /static を backend にプロキシ
├── firmware/                # ESP32 スケッチ
│   └── tomato_sensor_esp32/
│       ├── tomato_sensor_esp32.ino
│       ├── config.h.example  # 設定テンプレ
│       └── config.h          # (gitignore: 個人WiFi情報)
├── scripts/
│   ├── fetch_weather.py      # Open-Meteo 取得スクリプト
│   └── fetch_weather.bat     # タスクスケジューラ用ラッパー
├── docker-compose.yml        # db (postgres) + backend (fastapi)
└── README.md

---

## API エンドポイント概要

| メソッド | パス | 用途 |
|---|---|---|
| GET / POST / DELETE | `/api/readings` | 土壌水分 (ESP32 が POST) |
| GET / POST / DELETE | `/api/environments` | 天候・気温・湿度・日照 |
| GET / POST / PATCH / DELETE | `/api/plants` | 株 |
| GET / POST / DELETE | `/api/waterings` | 水やり |
| GET / POST / DELETE | `/api/harvests` | 収穫 |
| GET / POST / PATCH / DELETE | `/api/fruits` | 実 |
| GET | `/api/fruits/{id}/sunlight-since-flowering` | 累積日照時間 |
| GET / POST / DELETE | `/api/images` | 画像 (multipart) |
| 静的配信 | `/static/images/<filename>` | 画像取得 |

詳細は `/docs` (Swagger UI) 参照。

---

## つまずいた点 / 学んだこと

- **センサー水没による故障**: 校正テスト時に基板まで水に浸けたためショート。次回は防水処理 (シリコン or 熱収縮チューブ) が必要
- **ESP32 のブレッドボード幅問題**: a-j の全列に跨る配置で b-i が物理的に塞がる → F-F ジャンパーで直接接続が結局シンプル
- **CORS 設定 + Vite プロキシ**: フロント (5174) → バック (8001) を直接 fetch せず、Vite プロキシで `/api` を中継して CORS 回避
- **Windows ファイアウォール + ネットワークプロファイル**: 「Public」だと LAN 内通信もブロックされる → 「Private」に変更で解決
- **pydantic-settings の List 自動パース**: `cors_origins: List[str]` だと環境変数からのパースが失敗 → `str` で受けて property で split

---

## 今後の拡張予定

- センサーの防水化と長期運用
- 累積日照時間のグラフ化
- 株ごとの「収穫量推移」グラフ
- スマホ通知 (水分量が閾値以下になったら)
- 複数 ESP32 (`device_id` 別) のサポート

---

## ライセンス

学習目的のプロジェクト。


