import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.deps import get_current_user
from app.models.user import User
from app.config import get_settings

router = APIRouter(prefix="/upload", tags=["Media"])
settings = get_settings()
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / settings.UPLOAD_DIR


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an image file. Stores locally in the uploads directory."""
    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")

    # Ensure upload dir exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    return {
        "filename": filename,
        "url": f"/uploads/{filename}",
        "content_type": file.content_type,
        "size": len(contents),
    }
