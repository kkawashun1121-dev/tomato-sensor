"""収穫 (Harvest) のルーター"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/harvests", tags=["harvests"])


@router.get("", response_model=list[schemas.HarvestOut])
def list_harvests(
    plant_id: int | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    return crud.list_harvests(db, plant_id=plant_id, limit=limit)


@router.post("", response_model=schemas.HarvestOut)
def create_harvest(payload: schemas.HarvestCreate, db: Session = Depends(get_db)):
    row = crud.create_harvest(db, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return row