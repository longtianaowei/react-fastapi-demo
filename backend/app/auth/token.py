import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.model.user import RefreshToken


REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))


def create_refresh_token(db: Session, user_id: int):
    raw_token = secrets.token_urlsafe(48)
    token = RefreshToken(
        user_id=user_id,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(token)
    db.flush()
    return raw_token


def consume_refresh_token(db: Session, raw_token: str):
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .with_for_update()
        .first()
    )

    if not token or token.revoked:
        return None

    expires_at = token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        token.revoked = True
        db.flush()
        return None

    token.revoked = True
    db.flush()
    return token.user_id
