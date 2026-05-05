"""画像 (Image) のルーター — multipart アップロード対応"""
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..config import settings
from ..database import get_db

router = APIRouter(prefix="/api/images", tags=["images"])

# 画像保存ディレクトリ (起動時に存在保証)
IMAGE_DIR = Path(settings.image_dir)
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@router.get("", response_model=list[schemas.ImageOut])
def list_images(
    plant_id: int | None = None,
    fruit_id: int | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_images(db, plant_id=plant_id, fruit_id=fruit_id)


@router.post("", response_model=schemas.ImageOut)
async def upload_image(
    file: UploadFile = File(...),
    plant_id: int | None = Form(None),
    fruit_id: int | None = Form(None),
    description: str | None = Form(None),
    taken_at: datetime | None = Form(None),
    db: Session = Depends(get_db),
):
    # 拡張子チェック
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # ファイル名は UUID にして衝突を避ける
    new_filename = f"{uuid.uuid4().hex}{ext}"
    save_path = IMAGE_DIR / new_filename

    # 実ファイル保存
    contents = await file.read()
    save_path.write_bytes(contents)

    # DB に記録
    row = crud.create_image(
        db,
        filename=new_filename,
        original_name=file.filename,
        content_type=file.content_type,
        plant_id=plant_id,
        fruit_id=fruit_id,
        description=description,
        taken_at=taken_at,
    )
    return row