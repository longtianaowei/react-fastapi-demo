from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import verify_password
from app.auth.token import consume_refresh_token, create_refresh_token
from app.database import get_db
from app.model.user import User
from app.schema.auth import (
    CurrentUserResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
)
from app.schema.response import ApiResponse


router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(data: LoginRequest, db: Session = Depends(get_db)):
    identifier = data.identifier.strip()
    user = (
        db.query(User)
        .filter((User.email == identifier.lower()) | (User.name == identifier))
        .first()
    )

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或密码错误")

    response = TokenResponse(
        access_token=create_access_token(user.id, user.name),
        refresh_token=create_refresh_token(db, user.id),
    )
    db.commit()
    return ApiResponse.success(data=response)


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    user_id = consume_refresh_token(db, data.refresh_token)
    user = db.query(User).filter(User.id == user_id).first() if user_id else None

    if not user:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新凭证无效或已过期")

    response = TokenResponse(
        access_token=create_access_token(user.id, user.name),
        refresh_token=create_refresh_token(db, user.id),
    )
    db.commit()
    return ApiResponse.success(data=response)


@router.post("/logout", response_model=ApiResponse[None])
def logout(data: LogoutRequest, db: Session = Depends(get_db)):
    user_id = consume_refresh_token(db, data.refresh_token)
    if user_id is None:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新凭证无效或已过期")
    db.commit()
    return ApiResponse.success(message="退出成功")


@router.get("/me", response_model=ApiResponse[CurrentUserResponse])
def me(current_user: User = Depends(get_current_user)):
    return ApiResponse.success(data=current_user)
