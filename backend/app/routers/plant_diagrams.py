"""植物図エディタのルーター"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/plant-diagrams", tags=["plant-diagrams"])

# ── /types を先に定義（/{diagram_id} より前でないとルーティング衝突）─────────

@router.get("/types", response_model=list[schemas.PlantDiagramTypeOut])
def list_plant_diagram_types(db: Session = Depends(get_db)):
    return crud.list_plant_diagram_types(db)

@router.post("/types", response_model=schemas.PlantDiagramTypeOut, status_code=201)
def create_plant_diagram_type(payload: schemas.PlantDiagramTypeCreate, db: Session = Depends(get_db)):
    row = crud.create_plant_diagram_type(db, key=payload.key, name=payload.name, color=payload.color)
    if row is None:
        raise HTTPException(status_code=409, detail="Key already exists")
    return row

@router.delete("/types/{key}", status_code=204)
def delete_plant_diagram_type(key: str, db: Session = Depends(get_db)):
    if not crud.delete_plant_diagram_type(db, key):
        raise HTTPException(status_code=404, detail="PlantDiagramType not found")

# ── PlantDiagram (プランターごとの図) ─────────────────────────────────────────

@router.get("", response_model=list[schemas.PlantDiagramOut])
def list_plant_diagrams(db: Session = Depends(get_db)):
    return crud.list_plant_diagrams(db)

@router.post("", response_model=schemas.PlantDiagramOut, status_code=201)
def create_plant_diagram(payload: schemas.PlantDiagramCreate, db: Session = Depends(get_db)):
    return crud.create_plant_diagram(
        db, name=payload.name, plant_type_key=payload.plant_type_key,
        plant_id=payload.plant_id, diagram_json=payload.diagram_json
    )

@router.put("/{diagram_id}", response_model=schemas.PlantDiagramOut)
def update_plant_diagram(diagram_id: int, payload: schemas.PlantDiagramUpdate, db: Session = Depends(get_db)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    row = crud.update_plant_diagram(db, diagram_id, **updates)
    if row is None:
        raise HTTPException(status_code=404, detail="PlantDiagram not found")
    return row

@router.delete("/{diagram_id}", status_code=204)
def delete_plant_diagram(diagram_id: int, db: Session = Depends(get_db)):
    if not crud.delete_plant_diagram(db, diagram_id):
        raise HTTPException(status_code=404, detail="PlantDiagram not found")
