"""SQLAlchemy のエンジン・セッション・Base 定義"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from .config import settings


engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """全 ORM モデルの親クラス"""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI が API 呼び出しのたびに DB セッションを供給する関数"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()