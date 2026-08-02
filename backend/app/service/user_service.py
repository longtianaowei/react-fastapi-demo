from sqlalchemy.orm import Session

from app.model.user import User
from app.schema.user import UserCreate

from app.dal.user_dal import UserDAL



class UserService:


    def __init__(self):

        self.dal=UserDAL()


#   `获取所有用户`
    def list(
        self,
        db:Session
    ):

        return self.dal.get_all(db)



    def create(
        self,
        db:Session,
        data:UserCreate
    ):


        user=User(
            name=data.name,
            email=data.email
        )


        return self.dal.create(
            db,
            user
        )



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