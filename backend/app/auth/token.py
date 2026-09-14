import hashlib
import os
import secrets

from app.redis_client import redis_client


REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
REFRESH_TOKEN_TTL = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
REFRESH_TOKEN_PREFIX = "auth:refresh:"


def _token_key(raw_token: str):
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return f"{REFRESH_TOKEN_PREFIX}{token_hash}"


def create_refresh_token(db, user_id: int):
    raw_token = secrets.token_urlsafe(48)
    redis_client.setex(_token_key(raw_token), REFRESH_TOKEN_TTL, str(user_id))
    return raw_token


def consume_refresh_token(db, raw_token: str):
    key = _token_key(raw_token)
    user_id = redis_client.getdel(key)

    if not user_id:
        return None

    return int(user_id)
