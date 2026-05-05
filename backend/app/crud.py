"""Pydantic スキーマ (API入出力)"""
from datetime import datetime,timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from . import models
  
def list_readings(db: Session, limit: int = 600, hours: int | None = None):
    """測定値の一覧を新しい順で取得"""
    stmt = select(models.Reading)

    if hours is not None:
        since = datetime.utcnow() - timedelta(hours=hours)
        stmt = stmt.where(models.Reading.recorded_at >= since)

    stmt = stmt.order_by(models.Reading.recorded_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()

def create_reading_batch(db: Session, payload):
    """ESP32 からの一括測定値を保存"""
    rows = []
    for sample in payload.readings:
        row = models.Reading(
            device_id=payload.device_id,
            sensor_index=sample.sensor_index,
            raw=sample.raw,
            moisture_pct=sample.moisture_pct,
        )
        db.add(row)
        rows.append(row)
    db.commit()
    for row in rows:
        db.refresh(row)
    return rows

def create_environment(db: Session, payload):
    """環境データを 1 件追加"""
    data = payload.model_dump(exclude_none=True)
    row = models.EnvironmentReading(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def list_plants(db: Session):
    """株の一覧 (新しい順)"""
    stmt = select(models.Plant).order_by(models.Plant.id.desc())
    return db.execute(stmt).scalars().all()


def get_plant(db: Session, plant_id: int):
    """1 株を取得 (無ければ None)"""
    return db.get(models.Plant, plant_id)


def create_plant(db: Session, payload):
    """株を 1 件追加"""
    row = models.Plant(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_plant(db: Session, plant_id: int, payload):
    """株を部分更新 (送られたフィールドだけ更新)"""
    row = db.get(models.Plant, plant_id)
    if row is None:
        return None
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row

def list_waterings(db: Session, plant_id: int | None = None, limit: int = 200):
    """水やり履歴 (新しい順、plant_id で絞り込み可能)"""
    stmt = select(models.Watering)
    if plant_id is not None:
        stmt = stmt.where(models.Watering.plant_id == plant_id)
    stmt = stmt.order_by(models.Watering.watered_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


def create_watering(db: Session, payload):
    """水やりを 1 件追加 (Plant の存在チェック付き)"""
    plant = db.get(models.Plant, payload.plant_id)
    if plant is None:
        return None
    data = payload.model_dump(exclude_none=True)
    row = models.Watering(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def list_harvests(db: Session, plant_id: int | None = None, limit: int = 200):
    """収穫履歴 (新しい順、plant_id で絞り込み可能)"""
    stmt = select(models.Harvest)
    if plant_id is not None:
        stmt = stmt.where(models.Harvest.plant_id == plant_id)
    stmt = stmt.order_by(models.Harvest.harvested_on.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


def create_harvest(db: Session, payload):
    """収穫を 1 件追加 (Plant の存在チェック付き)"""
    plant = db.get(models.Plant, payload.plant_id)
    if plant is None:
        return None
    row = models.Harvest(**payload.model_dump(exclude_none=True))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row