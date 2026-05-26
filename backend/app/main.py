"""FastAPI のエントリーポイント"""
## routerのモト 

from fastapi.staticfiles import StaticFiles
from .routers import readings, environments, plants, waterings, harvests, fruits, images, measurements
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine
from . import models  


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
app.include_router(measurements.router)
app.include_router(environments.router)
app.include_router(plants.router)
app.include_router(waterings.router)
app.include_router(harvests.router)
app.include_router(fruits.router)
app.include_router(images.router)
app.mount(
    "/static/images",
    StaticFiles(directory=settings.image_dir),
    name="images",
)

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
