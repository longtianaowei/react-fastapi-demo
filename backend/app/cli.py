import argparse
import os

from sqlalchemy import func

from app.auth.password import hash_password
from app.database import SessionLocal
from app.model.user import User
from app.schema.user import normalize_email


def create_admin(name: str, email: str, password: str):
    normalized_email = normalize_email(email)
    if not 1 <= len(name) <= 50:
        raise ValueError("管理员名称长度必须为 1 到 50 个字符")
    if not 8 <= len(password) <= 128:
        raise ValueError("密码长度必须为 8 到 128 个字符")

    with SessionLocal() as db:
        exists = (
            db.query(User.id)
            .filter(func.lower(User.email) == normalized_email)
            .first()
        )
        if exists:
            raise ValueError("邮箱已存在")

        user = User(
            name=name,
            email=normalized_email,
            password_hash=hash_password(password),
            is_admin=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


def main():
    parser = argparse.ArgumentParser(description="初始化首个管理员账户")
    parser.add_argument("--name", default=os.getenv("ADMIN_NAME"))
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL"))
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD"))
    args = parser.parse_args()

    if not all((args.name, args.email, args.password)):
        parser.error("必须通过参数或 ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD 提供账户信息")

    try:
        user = create_admin(args.name, args.email, args.password)
    except ValueError as exc:
        parser.error(str(exc))

    print(f"管理员已创建: id={user.id}, email={user.email}")


if __name__ == "__main__":
    main()
