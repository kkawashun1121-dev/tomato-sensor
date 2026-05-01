# 🍅 Tomato Sensor

ESP32 + 静電容量式土壌水分センサー × 3 でトマトを栽培するデータ収集システム。

## 使う技術

- **マイコン**: ESP32
- **センサー**: 静電容量式土壌水分センサー × 3
- **バックエンド**: Python + FastAPI
- **DB**: PostgreSQL
- **フロントエンド**: React (Vite)

## 構成 (これから作る)

\`\`\`
tomato-sensor/
├── backend/   FastAPI + PostgreSQL
├── frontend/  React (Vite)
├── firmware/  ESP32 (Arduino)
└── docs/      ドキュメント
\`\`\`

## 開発状況

- [x] Postgres 起動
- [x] FastAPI 起動 (/healthz)
- [x] DB テーブル作成
- [x] API 実装
- [x] React ダッシュボード
- [x] ESP32 実装

##　全体構成

tomato-sensor/
├── [README.md](http://README.md)                    プロジェクト全体の入口
├── .gitignore
├── docker-compose.yml           Postgres + Backend を一括起動
│
├── docs/                        ドキュメント
│   ├── [architecture.md](http://architecture.md)            構成図
│   └── [wiring.md](http://wiring.md)                  配線図
│
├── firmware/                    ESP32 (Arduino)
│   ├── tomato_sensor_esp32.ino
│   ├── config.h.example           WiFi・サーバーURL設定テンプレ
│   └── [README.md](http://README.md)
│
├── backend/                     FastAPI + SQLAlchemy + PostgreSQL
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── [main.py](http://main.py)                FastAPI エントリーポイント
│   │   ├── [config.py](http://config.py)              pydantic-settings
│   │   ├── [database.py](http://database.py)            SQLAlchemyエンジン/セッション
│   │   ├── [models.py](http://models.py)              ORM (Reading, Observation)
│   │   ├── [schemas.py](http://schemas.py)             Pydantic スキーマ
│   │   ├── [crud.py](http://crud.py)                DB操作
│   │   └── routers/
│   │       ├── [readings.py](http://readings.py)        /api/readings
│   │       ├── [observations.py](http://observations.py)    /api/observations
│   │       └── [summary.py](http://summary.py)         /api/summary
│   ├── tests/test_[api.py](http://api.py)          pytest API結合テスト
│   └── scripts/seed_[dummy.py](http://dummy.py)      ダミーデータ投入
│
├── frontend/                    React + Vite
│   ├── package.json
│   ├── vite.config.js             /api → :8000 プロキシ
│   ├── index.html
│   ├── public/tomato.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── styles.css
│       ├── api/client.js          fetchラッパー
│       ├── hooks/useReadings.js   ポーリング
│       └── components/
│           ├── Header.jsx
│           ├── SummaryCards.jsx
│           ├── PeriodSelector.jsx
│           └── MoistureChart.jsx
│
└── data/.gitkeep

##　進め方

[フェーズ1] 土台 (frontend を空のまま、Postgres だけ動かす)
  1. README.md これのこと
  2. .gitignore
  githubでは公開したくないものを書く
  3. docker-compose.yml (db だけ)
  → 動作確認: docker compose up で Postgres が起動するか
  → コミット🌱

[フェーズ2] backend を最小で動かす
  4. backend/requirements.txt
    pythonで使うライブラリーを書く
    fastapi → API フレームワーク本体
    uvicorn → FastAPI を動かすサーバー
    sqlalchemy → DB操作 (ORM)
    psycopg → PostgreSQL に繋ぐドライバ
    pydantic → データの形チェック
    pydantic-settings → .env からの設定読み込み
    python-multipart → 画像アップロード用 (後で使う)
  5. backend/Dockerfile
  FROM python:3.12-slim → Python 3.12 入りの軽量イメージから始める
    COPY requirements.txt . → ホストの requirements.txt をコンテナにコピー
    RUN pip install ... → ライブラリをインストール
    COPY app ./app → 自分のコード (まだ空) をコピー
    CMD [...] → コンテナ起動時に走るコマンド (uvicorn で main.py を起動)
  6. backend/app/__init__.py (空)
  7. backend/app/config.py
  8. backend/app/database.py
  9. backend/app/main.py (まずは /healthz だけ)
  10. docker-compose.yml に backend を追加
  → 動作確認: http://localhost:8001/healthz
  → コミット🌱

[フェーズ3] backend のデータ層
  11. backend/app/models.py (テーブル定義)
  12. backend/app/schemas.py (API入出力)
  13. backend/app/crud.py (DB操作)
  → 動作確認: docker compose up で起動するか
  → コミット🌱

[フェーズ4] backend のルーター
  14. backend/app/routers/__init__.py
  15. routers/readings.py
  16. routers/summary.py
  17. routers/environment.py
  18. routers/plants.py
  19. routers/fruits.py
  20. routers/images.py
  21. main.py を更新 (ルーター登録)
  → 動作確認: Swagger UI で全API確認
  → コミット🌱

[フェーズ5] テスト・seed
  22. tests/test_api.py
  23. scripts/seed_dummy.py
  → コミット🌱

[フェーズ6] frontend
  24. npm create vite で雛形
  25. vite.config.js (プロキシ設定)
  26. src/api/client.js
  27. src/hooks/useReadings.js
  28. src/components/* (4ファイル)
  29. src/App.jsx (組み立て)
  → 動作確認: ダッシュボード表示
  → コミット🌱

[フェーズ7] firmware (実機があれば)
  30. firmware/config.h.example
  31. firmware/tomato_sensor_esp32.ino
  32. firmware/README.md

[フェーズ8] docs
  33. docs/architecture.md
  34. docs/wiring.md
  → コミット🌱