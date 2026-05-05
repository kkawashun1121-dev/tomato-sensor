"""株 (Plant) のルーター"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/plants", tags=["plants"])


@router.get("", response_model=list[schemas.PlantOut])
def list_plants(db: Session = Depends(get_db)):
    return crud.list_plants(db)


@router.get("/{plant_id}", response_model=schemas.PlantOut)
def get_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = crud.get_plant(db, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


@router.post("", response_model=schemas.PlantOut)
def create_plant(payload: schemas.PlantCreate, db: Session = Depends(get_db)):
    return crud.create_plant(db, payload)


@router.patch("/{plant_id}", response_model=schemas.PlantOut)
def update_plant(
    plant_id: int, payload: schemas.PlantUpdate, db: Session = Depends(get_db)
):
    plant = crud.update_plant(db, plant_id, payload)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant