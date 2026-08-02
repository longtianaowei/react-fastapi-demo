from fastapi import APIRouter,Depends

from sqlalchemy.orm import Session

from app.database import get_db

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
    response_model=list[UserResponse]
)
def list_users(
    db:Session=Depends(get_db)
):

    return service.list(db)



@router.post(
    "/create",
    response_model=UserResponse
)
def create_user(
    user:UserCreate,
    db:Session=Depends(get_db)
):

    return service.create(
        db,
        user
    )



@router.delete("/{id}")
def delete_user(
    id:int,
    db:Session=Depends(get_db)
):

    return service.delete(
        db,
        id
    )