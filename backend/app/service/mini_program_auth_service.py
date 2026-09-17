import hashlib
import json
import os
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token
from app.auth.token import create_refresh_token
from app.model.user import User
from app.schema.auth import MiniProgramTokenResponse
from app.schema.mini_program import MiniProgramLoginRequest


def default_mini_program_name(openid: str) -> str:
    suffix = hashlib.sha256(openid.encode()).hexdigest()[:6]
    return f"微信用户_{suffix}"


class MiniProgramAuthService:
    def login(self, db: Session, data: MiniProgramLoginRequest) -> tuple[User, MiniProgramTokenResponse]:
        appid = os.getenv("WECHAT_MINI_PROGRAM_APPID")
        secret = os.getenv("WECHAT_MINI_PROGRAM_SECRET")
        if not appid or not secret:
            raise RuntimeError("微信小程序 appid 和 secret 未配置")

        params = urlencode({"appid": appid, "secret": secret, "js_code": data.code, "grant_type": "authorization_code"})
        try:
            with urlopen(f"https://api.weixin.qq.com/sns/jscode2session?{params}", timeout=5) as response:
                result = json.load(response)
        except (HTTPError, URLError, TimeoutError) as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="微信登录服务暂时不可用") from exc

        if result.get("errcode") is not None or not result.get("openid"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="微信登录凭证无效")

        user = db.query(User).filter(User.mini_program_openid == result["openid"]).first()
        if not user:
            user = User(
                name=data.nickname or default_mini_program_name(result["openid"]),
                email=f"mini_{result['openid']}@local.invalid",
                password_hash=None,
                mini_program_openid=result["openid"],
                unionid=result.get("unionid"),
                avatar_url=data.avatar_url,
            )
            db.add(user)
        else:
            if data.nickname:
                user.name = data.nickname
            if data.avatar_url:
                user.avatar_url = data.avatar_url
            if result.get("unionid"):
                user.unionid = result["unionid"]

        db.commit()
        db.refresh(user)
        refresh_token = create_refresh_token(db, user.id)
        db.commit()
        return user, MiniProgramTokenResponse(
            access_token=create_access_token(user.id, user.name),
            refresh_token=refresh_token,
        )
