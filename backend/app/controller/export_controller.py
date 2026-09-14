from datetime import datetime
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import uuid4

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, RedirectResponse
from openpyxl import Workbook
from sqlalchemy.orm import Session
from starlette.background import BackgroundTask

from app.auth.dependencies import require_admin
from app.database import get_db
from app.service.storage_service import storage_service
from app.service.user_service import UserService


router = APIRouter(
    prefix="/exports",
    tags=["导出"],
)

service = UserService()


def delete_file(file_path: Path):
    file_path.unlink(missing_ok=True)


@router.get("/users")
def export_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    users, _ = service.list(
        db,
        page=1,
        page_size=10,
    )

    with NamedTemporaryFile(
        suffix=".xlsx",
        prefix="users-",
        delete=False,
    ) as temp_file:
        file_path = Path(temp_file.name)

    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "用户列表"
    worksheet.append(["ID", "姓名", "邮箱"])

    for user in users:
        worksheet.append([user.id, user.name, user.email])

    workbook.save(file_path)
    workbook.close()

    filename = f"用户列表-{datetime.now():%Y%m%d%H%M%S}.xlsx"
    media_type = (
        "application/vnd.openxmlformats-officedocument"
        ".spreadsheetml.sheet"
    )

    if storage_service.use_object_storage:
        key = f"exports/{uuid4().hex}.xlsx"
        storage_service.upload_file(file_path, key, media_type)
        file_path.unlink(missing_ok=True)
        download_url = storage_service.download_url(key, filename)
        return RedirectResponse(download_url, status_code=307)

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type,
        headers={
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
        background=BackgroundTask(delete_file, file_path),
    )
