import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,DeclarativeBase

from dotenv import load_dotenv


load_dotenv()


DATABASE_URL = (
    f"mysql+pymysql://"
    f"{os.getenv('MYSQL_USER')}:"
    f"{os.getenv('MYSQL_PASSWORD')}@"
    f"{os.getenv('MYSQL_HOST')}:"
    f"{os.getenv('MYSQL_PORT')}/"
    f"{os.getenv('MYSQL_DATABASE')}"
)


engine = create_engine(
    DATABASE_URL,
    echo=True
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    pass



def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()