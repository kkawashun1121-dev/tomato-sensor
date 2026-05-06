"""環境データ (天候/気温/湿度/日照) のルーター"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/environments", tags=["environments"])


@router.get("", response_model=list[schemas.EnvironmentOut])
def list_environments(limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_environments(db, limit=limit)


@router.post("", response_model=schemas.EnvironmentOut)
def create_environment(
    payload: schemas.EnvironmentCreate, db: Session = Depends(get_db)
):
    return crud.create_environment(db, payload)

@router.delete("/{environment_id}", status_code=204)
def delete_environment(environment_id: int, db: Session = Depends(get_db)):
    if not crud.delete_environment(db, environment_id):
        raise HTTPException(status_code=404, detail="Environment not found")
    return None