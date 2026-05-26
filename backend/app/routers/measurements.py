"""測定 (Measurement) のルーター — 1株を3本のセンサーで測った1回分を記録"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/measurements", tags=["measurements"])


@router.get("", response_model=list[schemas.MeasurementOut])
def list_measurements(
    plant_id: int | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    return crud.list_measurements(db, plant_id=plant_id, limit=limit)


@router.post("", response_model=schemas.MeasurementOut)
def create_measurement(payload: schemas.MeasurementCreate, db: Session = Depends(get_db)):
    row = crud.create_measurement(db, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return row


@router.delete("/{measurement_id}", status_code=204)
def delete_measurement(measurement_id: int, db: Session = Depends(get_db)):
    if not crud.delete_measurement(db, measurement_id):
        raise HTTPException(status_code=404, detail="Measurement not found")
    return None
