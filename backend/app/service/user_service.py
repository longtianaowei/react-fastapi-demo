from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.password import hash_password
from app.model.user import User
from app.schema.user import UserCreate

from app.dal.user_dal import UserDAL



class UserService:


    def __init__(self):

        self.dal=UserDAL()


#   `获取用户分页`
    def list(
        self,
        db:Session,
        page:int,
        page_size:int
    ):

        items,total=self.dal.get_page(
            db,
            page,
            page_size
        )

        return items,total



    def create(
        self,
        db:Session,
        data:UserCreate
    ):


        normalized_email = data.email.strip().lower()
        if db.query(User.id).filter(User.email == normalized_email).first():
            raise ValueError("邮箱已存在")

        user=User(
            name=data.name,
            email=normalized_email,
            password_hash=hash_password(data.password)
        )

        try:
            return self.dal.create(db, user)
        except IntegrityError:
            db.rollback()
            raise ValueError("邮箱已存在")



    def delete(
        self,
        db:Session,
        id:int
    ):

        user=self.dal.get_by_id(
            db,
            id
        )

        if user:

            self.dal.delete(
                db,
                user
            )

        return user