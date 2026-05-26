"""measurements API のテスト

実行方法 (backend ディレクトリで):
    pip install pytest
    DATABASE_URL は本ファイルが自動でテスト用 SQLite に差し替えるので不要。
    pytest tests/test_measurements.py -v
"""
import os
import tempfile

# app をインポートする前に、テスト用の SQLite を環境変数で指定する
# (database.py はインポート時に DATABASE_URL からエンジンを作るため)
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{_db_path}"
os.environ.setdefault("IMAGE_DIR", tempfile.mkdtemp())

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    # with を使うと lifespan が走り、テーブルが作られる
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def plant_id(client):
    res = client.post(
        "/api/plants",
        json={"variety": "テスト株", "planted_date": "2026-05-01"},
    )
    assert res.status_code == 200
    return res.json()["id"]


def test_create_measurement_computes_average(client, plant_id):
    """3本の値を送ると平均が計算され、元の値も保存される"""
    payload = {
        "plant_id": plant_id,
        "samples": [
            {"sensor_index": 0, "raw": 1755, "moisture_pct": 80.2},
            {"sensor_index": 1, "raw": 1760, "moisture_pct": 68.5},
            {"sensor_index": 2, "raw": 1582, "moisture_pct": 86.9},
        ],
        "note": "朝の計測",
    }
    res = client.post("/api/measurements", json=payload)
    assert res.status_code == 200
    data = res.json()
    # (80.2 + 68.5 + 86.9) / 3 = 78.53... → 78.5
    assert data["avg_pct"] == 78.5
    assert data["pct_0"] == 80.2
    assert data["raw_2"] == 1582
    assert data["plant_id"] == plant_id
    assert data["note"] == "朝の計測"


def test_two_samples_average(client, plant_id):
    """2本だけ送っても、その2本の平均になる"""
    res = client.post(
        "/api/measurements",
        json={
            "plant_id": plant_id,
            "samples": [
                {"sensor_index": 0, "moisture_pct": 40},
                {"sensor_index": 1, "moisture_pct": 60},
            ],
        },
    )
    assert res.status_code == 200
    assert res.json()["avg_pct"] == 50.0


def test_list_and_delete(client, plant_id):
    """記録 → 一覧に出る → 削除 → 一覧から消える"""
    res = client.post(
        "/api/measurements",
        json={
            "plant_id": plant_id,
            "samples": [{"sensor_index": 0, "moisture_pct": 55}],
        },
    )
    mid = res.json()["id"]

    res = client.get(f"/api/measurements?plant_id={plant_id}")
    assert res.status_code == 200
    assert any(m["id"] == mid for m in res.json())

    res = client.delete(f"/api/measurements/{mid}")
    assert res.status_code == 204

    res = client.get(f"/api/measurements?plant_id={plant_id}")
    assert all(m["id"] != mid for m in res.json())


def test_missing_plant_returns_404(client):
    """存在しない株に記録しようとすると 404"""
    res = client.post(
        "/api/measurements",
        json={
            "plant_id": 999999,
            "samples": [{"sensor_index": 0, "moisture_pct": 50}],
        },
    )
    assert res.status_code == 404


def test_delete_missing_returns_404(client):
    """存在しない測定を削除しようとすると 404"""
    res = client.delete("/api/measurements/999999")
    assert res.status_code == 404
