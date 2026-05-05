"""水やり (Watering) のルーター"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/waterings", tags=["waterings"])


@router.get("", response_model=list[schemas.WateringOut])
def list_waterings(
    plant_id: int | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    return crud.list_waterings(db, plant_id=plant_id, limit=limit)


@router.post("", response_model=schemas.WateringOut)
def create_watering(payload: schemas.WateringCreate, db: Session = Depends(get_db)):
    row = crud.create_watering(db, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return row