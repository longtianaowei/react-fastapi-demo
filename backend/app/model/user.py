from sqlalchemy.orm import Mapped, mapped_column

from sqlalchemy import String,Integer

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
        String(100)
    )