"""画像 (Image) のルーター — multipart アップロード対応"""
import io
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..config import settings
from ..database import get_db

router = APIRouter(prefix="/api/images", tags=["images"])

IMAGE_DIR = Path(settings.image_dir)
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"}
# ブラウザが表示できない形式は JPEG に変換して保存する
HEIC_EXTENSIONS = {".heic", ".heif"}


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
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {ALLOWED_EXTENSIONS}",
        )

    contents = await file.read()
    content_type = file.content_type

    # HEIC/HEIF はブラウザで表示できないため JPEG に変換する。
    # 変換ライブラリ(pillow/pillow-heif)が無くてもアプリ全体は起動できるよう、
    # ここで初めて import する(遅延 import)。
    if ext in HEIC_EXTENSIONS:
        try:
            import pillow_heif
        except ModuleNotFoundError:
            raise HTTPException(
                status_code=400,
                detail="HEIC変換ライブラリ(pillow-heif)が未インストールです。"
                       "backend を再ビルドするか、JPEG/PNG でアップロードしてください。",
            )
        try:
            # read_heif は libheif で直接デコードするため、PIL の形式判定に依存しない
            heif_file = pillow_heif.read_heif(io.BytesIO(contents))
            img = heif_file.to_pillow().convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=90)
            contents = buf.getvalue()
        except Exception as e:
            import traceback
            print("=== HEIC変換エラー ===", flush=True)
            traceback.print_exc()
            raise HTTPException(
                status_code=400,
                detail=f"HEIC の変換に失敗しました: {type(e).__name__}: {e}。"
                       f"うまくいかない場合は iPhone の設定→カメラ→フォーマットを「互換性優先」にするか、JPEG で保存してください。",
            )
        ext = ".jpg"
        content_type = "image/jpeg"

    new_filename = f"{uuid.uuid4().hex}{ext}"
    save_path = IMAGE_DIR / new_filename
    save_path.write_bytes(contents)

    row = crud.create_image(
        db,
        filename=new_filename,
        original_name=file.filename,
        content_type=content_type,
        plant_id=plant_id,
        fruit_id=fruit_id,
        description=description,
        taken_at=taken_at,
    )
    return row


@router.delete("/{image_id}", status_code=204)
def delete_image(image_id: int, db: Session = Depends(get_db)):
    ok, filename = crud.delete_image(db, image_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Image not found")
    if filename:
        path = IMAGE_DIR / filename
        if path.exists():
            path.unlink()
    return None