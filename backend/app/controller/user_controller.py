from fastapi import APIRouter,Depends

from sqlalchemy.orm import Session

from app.database import get_db

from app.schema.response import ApiResponse
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
    response_model=ApiResponse[list[UserResponse]]
)
def list_users(
    db:Session=Depends(get_db)
):

    return ApiResponse.success(
        data=service.list(db)
    )



@router.post(
    "/create",
    response_model=ApiResponse[UserResponse]
)
def create_user(
    user:UserCreate,
    db:Session=Depends(get_db)
):

    return ApiResponse.success(
        data=service.create(
            db,
            user
        ),
        message="创建成功"
    )



@router.delete(
    "/{id}",
    response_model=ApiResponse[UserResponse]
)
def delete_user(
    id:int,
    db:Session=Depends(get_db)
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
