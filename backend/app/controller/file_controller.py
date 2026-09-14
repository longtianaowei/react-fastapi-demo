from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse, Response

from app.auth.dependencies import get_current_user
from app.schema.response import ApiResponse
from app.service.storage_service import storage_service


router = APIRouter(
    prefix="/files",
    tags=["文件"],
)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    suffix = Path(file.filename or "").suffix
    stored_name = f"{uuid4().hex}{suffix}"
    stored_path = storage_service.root / "uploads" / stored_name
    stored_path.parent.mkdir(parents=True, exist_ok=True)

    with stored_path.open("wb") as output:
        while chunk := await file.read(1024 * 1024):
            output.write(chunk)

    size = stored_path.stat().st_size
    key = f"uploads/{stored_name}"
    storage_service.upload_file(stored_path, key, file.content_type)
    if storage_service.use_object_storage:
        stored_path.unlink(missing_ok=True)

    return ApiResponse.success(
        data={
            "filename": file.filename,
            "stored_name": stored_name,
            "size": size,
            "storage_key": key,
        },
        message="上传成功",
    )


@router.get("/{stored_name}/download")
def download_file(
    stored_name: str,
    current_user=Depends(get_current_user),
):
    key = f"uploads/{stored_name}"
    download_url = storage_service.download_url(key, stored_name)

    if download_url:
        return RedirectResponse(download_url, status_code=307)

    stored_path = storage_service.local_path(key)

    if not stored_path.is_file():
        raise HTTPException(status_code=404, detail="文件不存在")

    return FileResponse(
        stored_path,
        filename=stored_name,
        media_type="application/octet-stream",
        headers={
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/demo-download")
def demo_download():
    content = "name,email\nAlice,alice@example.com\nBob,bob@example.com\n"
    filename = "用户列表.csv"

    return Response(
        content=content.encode("utf-8-sig"),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="users.csv"; '
                f"filename*=UTF-8''{quote(filename)}"
            ),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
