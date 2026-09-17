import os

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import verify_password
from app.auth.token import (
    REFRESH_TOKEN_EXPIRE_DAYS,
    consume_refresh_token,
    create_refresh_token,
)
from app.database import get_db
from app.model.user import User
from app.schema.auth import (
    CurrentUserResponse,
    LoginRequest,
    MiniProgramTokenResponse,
    WebTokenResponse,
)
from app.schema.mini_program import MiniProgramLoginRequest, MiniProgramRefreshRequest
from app.schema.response import ApiResponse
from app.service.mini_program_auth_service import MiniProgramAuthService


router = APIRouter(prefix="/auth", tags=["认证"])
mini_program_auth_service = MiniProgramAuthService()

REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
REFRESH_TOKEN_COOKIE_SECURE = os.getenv(
    "REFRESH_TOKEN_COOKIE_SECURE", "false"
).lower() in {"1", "true", "yes", "on"}


def set_refresh_token_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=REFRESH_TOKEN_COOKIE_SECURE,
        samesite="lax",
        path="/auth",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


@router.post("/login", response_model=ApiResponse[WebTokenResponse])
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    identifier = data.identifier.strip()
    user = (
        db.query(User)
        .filter((User.email == identifier.lower()) | (User.name == identifier))
        .first()
    )

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或密码错误")

    token_response = WebTokenResponse(
        access_token=create_access_token(user.id, user.name),
    )
    refresh_token = create_refresh_token(db, user.id)
    db.commit()
    set_refresh_token_cookie(response, refresh_token)
    return ApiResponse.success(data=token_response)


@router.post("/mini-program-login", response_model=ApiResponse[MiniProgramTokenResponse])
def mini_program_login(data: MiniProgramLoginRequest, db: Session = Depends(get_db)):
    _, token_response = mini_program_auth_service.login(db, data)
    return ApiResponse.success(data=token_response)


@router.post("/mini-program-refresh", response_model=ApiResponse[MiniProgramTokenResponse])
def mini_program_refresh(data: MiniProgramRefreshRequest, db: Session = Depends(get_db)):
    user_id = consume_refresh_token(db, data.refresh_token)
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if not user:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新凭证无效或已过期")
    new_refresh_token = create_refresh_token(db, user.id)
    db.commit()
    return ApiResponse.success(data=MiniProgramTokenResponse(
        access_token=create_access_token(user.id, user.name),
        refresh_token=new_refresh_token,
    ))


@router.post("/refresh", response_model=ApiResponse[WebTokenResponse])
def refresh_token(response: Response, refresh_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    user_id = consume_refresh_token(db, refresh_token) if refresh_token else None
    user = db.query(User).filter(User.id == user_id).first() if user_id else None

    if not user:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新凭证无效或已过期")

    token_response = WebTokenResponse(
        access_token=create_access_token(user.id, user.name),
    )
    new_refresh_token = create_refresh_token(db, user.id)
    db.commit()
    set_refresh_token_cookie(response, new_refresh_token)
    return ApiResponse.success(data=token_response)


@router.post("/logout", response_model=ApiResponse[None])
def logout(response: Response, refresh_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    user_id = consume_refresh_token(db, refresh_token) if refresh_token else None
    if user_id is None:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新凭证无效或已过期")
    db.commit()
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        path="/auth",
    )
    return ApiResponse.success(message="退出成功")


@router.get("/me", response_model=ApiResponse[CurrentUserResponse])
def me(current_user: User = Depends(get_current_user)):
    return ApiResponse.success(data=current_user)
