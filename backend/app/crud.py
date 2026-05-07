"""CRUD 操作 (DB アクセス)"""
from datetime import datetime, timedelta, date as _date
from sqlalchemy import select
from sqlalchemy.orm import Session
from . import models


# ============ Reading (土壌水分) ============

def list_readings(db: Session, limit: int = 600, hours: int | None = None):
    stmt = select(models.Reading)
    if hours is not None:
        since = datetime.utcnow() - timedelta(hours=hours)
        stmt = stmt.where(models.Reading.recorded_at >= since)
    stmt = stmt.order_by(models.Reading.recorded_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


def create_reading_batch(db: Session, payload):
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


def delete_reading(db: Session, reading_id: int) -> bool:
    row = db.get(models.Reading, reading_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True


# ============ EnvironmentReading (天候) ============

def list_environments(db: Session, limit: int = 100):
    stmt = (
        select(models.EnvironmentReading)
        .order_by(models.EnvironmentReading.recorded_at.desc())
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()


def create_environment(db: Session, payload):
    data = payload.model_dump(exclude_none=True)
    row = models.EnvironmentReading(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_environment(db: Session, environment_id: int) -> bool:
    row = db.get(models.EnvironmentReading, environment_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True


# ============ Plant (株) ============

def list_plants(db: Session):
    stmt = select(models.Plant).order_by(models.Plant.id.desc())
    return db.execute(stmt).scalars().all()


def get_plant(db: Session, plant_id: int):
    return db.get(models.Plant, plant_id)


def create_plant(db: Session, payload):
    row = models.Plant(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_plant(db: Session, plant_id: int, payload):
    row = db.get(models.Plant, plant_id)
    if row is None:
        return None
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


def delete_plant(db: Session, plant_id: int) -> bool:
    row = db.get(models.Plant, plant_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True


# ============ Watering (水やり) ============

def list_waterings(db: Session, plant_id: int | None = None, limit: int = 200):
    stmt = select(models.Watering)
    if plant_id is not None:
        stmt = stmt.where(models.Watering.plant_id == plant_id)
    stmt = stmt.order_by(models.Watering.watered_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


def create_watering(db: Session, payload):
    plant = db.get(models.Plant, payload.plant_id)
    if plant is None:
        return None
    data = payload.model_dump(exclude_none=True)
    row = models.Watering(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_watering(db: Session, watering_id: int) -> bool:
    row = db.get(models.Watering, watering_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True


# ============ Harvest (収穫) ============

def list_harvests(db: Session, plant_id: int | None = None, limit: int = 200):
    stmt = select(models.Harvest)
    if plant_id is not None:
        stmt = stmt.where(models.Harvest.plant_id == plant_id)
    stmt = stmt.order_by(models.Harvest.harvested_on.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


def create_harvest(db: Session, payload):
    plant = db.get(models.Plant, payload.plant_id)
    if plant is None:
        return None
    row = models.Harvest(**payload.model_dump(exclude_none=True))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_harvest(db: Session, harvest_id: int) -> bool:
    row = db.get(models.Harvest, harvest_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True


# ============ Fruit (実) ============

def list_fruits(db: Session, plant_id: int | None = None):
    stmt = select(models.Fruit)
    if plant_id is not None:
        stmt = stmt.where(models.Fruit.plant_id == plant_id)
    stmt = stmt.order_by(models.Fruit.id.desc())
    return db.execute(stmt).scalars().all()


def get_fruit(db: Session, fruit_id: int):
    return db.get(models.Fruit, fruit_id)


def create_fruit(db: Session, payload):
    plant = db.get(models.Plant, payload.plant_id)
    if plant is None:
        return None
    row = models.Fruit(**payload.model_dump(exclude_none=True))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_fruit(db: Session, fruit_id: int, payload):
    row = db.get(models.Fruit, fruit_id)
    if row is None:
        return None
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


def delete_fruit(db: Session, fruit_id: int) -> bool:
    row = db.get(models.Fruit, fruit_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True


def sunlight_since_flowering(db: Session, fruit_id: int):
    fruit = db.get(models.Fruit, fruit_id)
    if fruit is None or fruit.flowering_date is None:
        return None
    until = fruit.harvested_on or _date.today()
    start = datetime.combine(fruit.flowering_date, datetime.min.time())
    end = datetime.combine(until, datetime.max.time())
    stmt = select(models.EnvironmentReading).where(
        models.EnvironmentReading.recorded_at >= start,
        models.EnvironmentReading.recorded_at <= end,
        models.EnvironmentReading.sunlight_hours.is_not(None),
    )
    rows = db.execute(stmt).scalars().all()
    total = sum(r.sunlight_hours for r in rows)
    days = (until - fruit.flowering_date).days + 1
    return {
        "fruit_id": fruit.id,
        "flowering_date": fruit.flowering_date,
        "until": until,
        "total_sunlight_hours": round(total, 2),
        "days": days,
    }


# ============ Image (画像) ============

def list_images(
    db: Session,
    plant_id: int | None = None,
    fruit_id: int | None = None,
    limit: int = 200,
):
    stmt = select(models.Image)
    if plant_id is not None:
        stmt = stmt.where(models.Image.plant_id == plant_id)
    if fruit_id is not None:
        stmt = stmt.where(models.Image.fruit_id == fruit_id)
    stmt = stmt.order_by(models.Image.uploaded_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


def create_image(
    db: Session,
    *,
    filename: str,
    original_name: str | None,
    content_type: str | None,
    plant_id: int | None = None,
    fruit_id: int | None = None,
    description: str | None = None,
    taken_at: datetime | None = None,
):
    row = models.Image(
        filename=filename,
        original_name=original_name,
        content_type=content_type,
        plant_id=plant_id,
        fruit_id=fruit_id,
        description=description,
        taken_at=taken_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_image(db: Session, image_id: int) -> tuple[bool, str | None]:
    """戻り値: (削除できたか, 削除されたファイル名)"""
    row = db.get(models.Image, image_id)
    if row is None:
        return False, None
    filename = row.filename
    db.delete(row)
    db.commit()
    return True, filename