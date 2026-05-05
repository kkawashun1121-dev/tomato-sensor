"""FastAPI のエントリーポイント"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from . import models  # テーブル作成のためにimport

from .routers import readings, environments, plants, waterings, harvests, fruits


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="トマト栽培API",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(readings.router)
app.include_router(environments.router)  # ← 追加
app.include_router(plants.router)
app.include_router(waterings.router)
app.include_router(harvests.router)
app.include_router(fruits.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
