"""
Open-Meteo (無料・APIキー不要) から「日ごとの日照時間 (その日の合計)」を取得して
backend の /api/environments に保存するスクリプト。

ポイント:
- 1日1回の実行でOK。過去 N 日ぶんをまとめて取得し、
  「まだDBに無い日」だけ追加し、「すでにある日」は最新値に更新する(冪等)。
- パソコンが落ちていた日も、あとで走らせれば API からさかのぼって補完される。
  → 累積日照時間がパソコンの稼働時間に左右されなくなる。

使い方:
    python scripts/fetch_weather.py                 # 直近 N 日を補完 (デフォルト30日)
    python scripts/fetch_weather.py --days 60        # 過去60日ぶん
    python scripts/fetch_weather.py --reset          # 既存の環境データを全削除してから入れ直す
    python scripts/fetch_weather.py --lat 35.68 --lon 139.69

定期実行は Windows のタスクスケジューラや cron で「1日1回」。
"""
import argparse
import sys
from datetime import datetime
import urllib.request
import urllib.parse
import json

DEFAULT_LAT = 34.95   # 名古屋付近 (好きな緯度経度に変更してOK)
DEFAULT_LON = 137.16
BACKEND_URL = "http://localhost:8001/api/environments"

# 日ごとレコードであることを示す目印 (手入力や旧データと区別するため)
DAILY_NOTE_PREFIX = "auto-daily"

WEATHER_CODE_MAP = {
    0: "晴れ", 1: "概ね晴れ", 2: "一部曇り", 3: "曇り",
    45: "霧", 48: "霧氷",
    51: "弱い霧雨", 53: "霧雨", 55: "強い霧雨",
    61: "弱い雨", 63: "雨", 65: "強い雨",
    71: "弱い雪", 73: "雪", 75: "強い雪",
    80: "にわか雨", 81: "強いにわか雨", 82: "激しいにわか雨",
    85: "にわか雪", 86: "強いにわか雪",
    95: "雷雨", 96: "雷雨(ひょう)", 99: "激しい雷雨",
}


def fetch_daily_weather(lat: float, lon: float, past_days: int) -> dict:
    """Open-Meteo から日ごとの気象情報 (過去 past_days 日〜今日) を取得"""
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "weather_code,temperature_2m_mean,sunshine_duration",
        "past_days": past_days,
        "forecast_days": 1,        # 今日のぶんも含める (翌日に実測へ更新される)
        "timezone": "Asia/Tokyo",
    }
    url = "https://api.open-meteo.com/v1/forecast?" + urllib.parse.urlencode(params)
    print(f"Fetching: {url}")
    with urllib.request.urlopen(url, timeout=20) as resp:
        return json.loads(resp.read())


def get_existing() -> list:
    """既存の環境データを取得"""
    url = BACKEND_URL + "?" + urllib.parse.urlencode({"limit": 2000})
    with urllib.request.urlopen(url, timeout=15) as resp:
        return json.loads(resp.read())


def post_environment(payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BACKEND_URL, data=body,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def delete_environment(env_id: int) -> None:
    req = urllib.request.Request(f"{BACKEND_URL}/{env_id}", method="DELETE")
    urllib.request.urlopen(req, timeout=15).read()


def date_of(recorded_at: str) -> str:
    """ISO日時文字列から 'YYYY-MM-DD' を取り出す"""
    return (recorded_at or "")[:10]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lat", type=float, default=DEFAULT_LAT)
    parser.add_argument("--lon", type=float, default=DEFAULT_LON)
    parser.add_argument("--days", type=int, default=30, help="さかのぼって補完する日数")
    parser.add_argument("--reset", action="store_true",
                        help="既存の環境データを全削除してから入れ直す")
    args = parser.parse_args()

    # 1) 既存データを取得
    try:
        existing = get_existing()
    except Exception as e:
        print(f"ERROR: 既存データ取得に失敗: {e}", file=sys.stderr)
        sys.exit(1)

    # 2) --reset なら全削除
    if args.reset:
        print(f"--reset: 既存の環境データ {len(existing)} 件を削除します")
        for row in existing:
            delete_environment(row["id"])
        existing = []

    # すでに日ごとレコードがある日付 -> id のマップ (更新用)
    daily_by_date = {
        date_of(r.get("recorded_at")): r["id"]
        for r in existing
        if (r.get("note") or "").startswith(DAILY_NOTE_PREFIX)
    }

    # 3) Open-Meteo から日ごとデータ取得
    try:
        data = fetch_daily_weather(args.lat, args.lon, args.days)
    except Exception as e:
        print(f"ERROR: 天気取得に失敗: {e}", file=sys.stderr)
        sys.exit(1)

    daily = data.get("daily", {})
    dates = daily.get("time", [])
    codes = daily.get("weather_code", [])
    temps = daily.get("temperature_2m_mean", [])
    suns = daily.get("sunshine_duration", [])

    added, updated = 0, 0
    for i, d in enumerate(dates):
        sun_sec = suns[i] if i < len(suns) and suns[i] is not None else 0
        payload = {
            "recorded_at": f"{d}T12:00:00",
            "weather": WEATHER_CODE_MAP.get(codes[i] if i < len(codes) else None,
                                            "unknown"),
            "temperature_c": temps[i] if i < len(temps) else None,
            # sunshine_duration は「その日の合計(秒)」なので時間に変換
            "sunlight_hours": round(sun_sec / 3600, 2),
            "note": f"{DAILY_NOTE_PREFIX}: open-meteo @ {args.lat},{args.lon}",
        }
        # すでにその日があれば、消してから入れ直す(最新値に更新)
        if d in daily_by_date:
            delete_environment(daily_by_date[d])
            post_environment(payload)
            updated += 1
        else:
            post_environment(payload)
            added += 1

    print(f"OK: 追加 {added} 件 / 更新 {updated} 件 "
          f"(期間 {dates[0] if dates else '-'} 〜 {dates[-1] if dates else '-'})")


if __name__ == "__main__":
    main()
