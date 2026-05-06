"""
Open-Meteo (無料・APIキー不要) から現在の天気・気温・湿度・日射を取得して
backend の /api/environments に POST するスクリプト

使い方:
    python scripts/fetch_weather.py
    python scripts/fetch_weather.py --lat 35.68 --lon 139.69

定期実行は Windows のタスクスケジューラや cron で。
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


def fetch_weather(lat: float, lon: float) -> dict:
    """Open-Meteo から現在の気象情報を取得"""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,weather_code,sunshine_duration",
        "timezone": "Asia/Tokyo",
    }
    url = "https://api.open-meteo.com/v1/forecast?" + urllib.parse.urlencode(params)
    print(f"Fetching: {url}")

    with urllib.request.urlopen(url, timeout=15) as resp:
        return json.loads(resp.read())


def post_environment(payload: dict) -> dict:
    """backend に環境データを POST"""
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BACKEND_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lat", type=float, default=DEFAULT_LAT)
    parser.add_argument("--lon", type=float, default=DEFAULT_LON)
    args = parser.parse_args()

    weather = fetch_weather(args.lat, args.lon)
    current = weather.get("current", {})
    code = current.get("weather_code")

    payload = {
        "weather": WEATHER_CODE_MAP.get(code, f"unknown({code})"),
        "temperature_c": current.get("temperature_2m"),
        "humidity_pct": current.get("relative_humidity_2m"),
        # sunshine_duration は秒単位なので時間に変換 (1 時間あたりの値)
        "sunlight_hours": (current.get("sunshine_duration") or 0) / 3600,
        "note": f"auto: open-meteo @ {args.lat},{args.lon}",
    }

    print("POST payload:", json.dumps(payload, ensure_ascii=False, indent=2))

    try:
        result = post_environment(payload)
        print("OK, created id:", result.get("id"))
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()