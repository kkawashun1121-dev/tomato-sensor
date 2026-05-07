"""土壌水分 (Reading) のルーター"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/readings", tags=["readings"])


@router.get("", response_model=list[schemas.ReadingOut])
def list_readings(
    limit: int = 600,
    hours: int | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_readings(db, limit=limit, hours=hours)


@router.post("", response_model=list[schemas.ReadingOut])
def post_readings(
    payload: schemas.ReadingBatchCreate,
    db: Session = Depends(get_db),
):
    return crud.create_reading_batch(db, payload)


@router.delete("/{reading_id}", status_code=204)
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    if not crud.delete_reading(db, reading_id):
        raise HTTPException(status_code=404, detail="Reading not found")
    return None