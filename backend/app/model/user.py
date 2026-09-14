from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String

from app.database import Base



class User(Base):

    __tablename__="users"


    id:Mapped[int]=mapped_column(
        Integer,
        primary_key=True,
        index=True
    )


    name:Mapped[str]=mapped_column(
        String(50)
    )


    email:Mapped[str]=mapped_column(
        String(100),
        index=True
    )

    password_hash:Mapped[str | None]=mapped_column(
        String(255),
        nullable=True
    )

    is_admin:Mapped[bool]=mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    refresh_tokens:Mapped[list["RefreshToken"]]=relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id:Mapped[int]=mapped_column(Integer, primary_key=True)
    user_id:Mapped[int]=mapped_column(ForeignKey("users.id"), index=True)
    token_hash:Mapped[str]=mapped_column(String(64), unique=True, index=True)
    expires_at:Mapped[datetime]=mapped_column(DateTime(timezone=True))
    revoked:Mapped[bool]=mapped_column(Boolean, default=False)

    user:Mapped["User"]=relationship(back_populates="refresh_tokens")