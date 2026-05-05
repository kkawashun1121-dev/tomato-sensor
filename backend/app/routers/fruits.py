"""実 (Fruit) のルーター"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/fruits", tags=["fruits"])


@router.get("", response_model=list[schemas.FruitOut])
def list_fruits(plant_id: int | None = None, db: Session = Depends(get_db)):
    return crud.list_fruits(db, plant_id=plant_id)


@router.get("/{fruit_id}", response_model=schemas.FruitOut)
def get_fruit(fruit_id: int, db: Session = Depends(get_db)):
    fruit = crud.get_fruit(db, fruit_id)
    if fruit is None:
        raise HTTPException(status_code=404, detail="Fruit not found")
    return fruit


@router.post("", response_model=schemas.FruitOut)
def create_fruit(payload: schemas.FruitCreate, db: Session = Depends(get_db)):
    fruit = crud.create_fruit(db, payload)
    if fruit is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return fruit


@router.patch("/{fruit_id}", response_model=schemas.FruitOut)
def update_fruit(
    fruit_id: int, payload: schemas.FruitUpdate, db: Session = Depends(get_db)
):
    fruit = crud.update_fruit(db, fruit_id, payload)
    if fruit is None:
        raise HTTPException(status_code=404, detail="Fruit not found")
    return fruit


@router.get(
    "/{fruit_id}/sunlight-since-flowering",
    response_model=schemas.SunlightSinceFlowering,
)
def sunlight_since_flowering(fruit_id: int, db: Session = Depends(get_db)):
    result = crud.sunlight_since_flowering(db, fruit_id)
    if result is None:
        raise HTTPException(
            status_code=404, detail="Fruit not found or flowering_date not set"
        )
    return result