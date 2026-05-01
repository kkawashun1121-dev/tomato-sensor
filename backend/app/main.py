"""FastAPI のエントリーポイント (最小版)"""
from fastapi import FastAPI

app = FastAPI(title="トマト栽培API", version="0.1.0")


@app.get("/healthz")
def healthz():
    return {"status": "ok"}