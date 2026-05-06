"""ESP32 からのセンサーデータと取得API"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status,HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/readings", tags=["readings"])


@router.post("", response_model=list[schemas.ReadingOut],
             status_code=status.HTTP_201_CREATED)
def create_readings(payload: schemas.ReadingBatchCreate, db: Session = Depends(get_db)):
    """ESP32 から3センサー分を一括投稿"""
    return crud.create_reading_batch(db, payload)


@router.get("", response_model=list[schemas.ReadingOut])
def list_readings(
    limit: int = Query(600, ge=1, le=10000),
    hours: Optional[float] = Query(None, gt=0),
    db: Session = Depends(get_db),
):
    """履歴取得"""
    return crud.list_readings(db, limit=limit, hours=hours)

@router.delete("/{reading_id}", status_code=204)
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    if not crud.delete_reading(db, reading_id):
        raise HTTPException(status_code=404, detail="Reading not found")
    return None