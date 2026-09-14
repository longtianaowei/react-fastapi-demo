from fastapi import APIRouter,Depends,Query

from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.database import get_db

from app.schema.response import ApiResponse,PageData
from app.schema.user import (
    UserCreate,
    UserResponse
)

from app.service.user_service import UserService



router=APIRouter(
    prefix="/users",
    tags=["用户"]
)


service=UserService()



@router.get(
    "/all",
    response_model=ApiResponse[PageData[UserResponse]]
)
def list_users(
    page:int=Query(1,ge=1),
    page_size:int=Query(10,ge=1,le=100),
    db:Session=Depends(get_db),
    current_user=Depends(require_admin)
):

    items,total=service.list(
        db,
        page,
        page_size
    )

    return ApiResponse.success(
        data=PageData.create(
            items=items,
            total=total,
            page=page,
            page_size=page_size
        )
    )



@router.post(
    "/create",
    response_model=ApiResponse[UserResponse]
)
def create_user(
    user:UserCreate,
    db:Session=Depends(get_db),
    current_user=Depends(require_admin)
):

    try:
        created_user = service.create(db, user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return ApiResponse.success(data=created_user, message="创建成功")



@router.delete(
    "/{id}",
    response_model=ApiResponse[UserResponse]
)
def delete_user(
    id:int,
    db:Session=Depends(get_db),
    current_user=Depends(require_admin)
):

    user=service.delete(
        db,
        id
    )

    if not user:

        return ApiResponse.error(
            code=404,
            message="用户不存在"
        )

    return ApiResponse.success(
        data=user,
        message="删除成功"
    )
