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