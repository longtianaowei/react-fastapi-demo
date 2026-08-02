import select

from sqlalchemy.orm import Session

from app.model.user import User

class UserDAL:

    def get_all(
        self,
        db:Session
    ):

        return db.query(User).all()



    def get_by_id(
        self,
        db:Session,
        id:int
    ):

        return (
            db.query(User)
            .filter(User.id==id)
            .first()
        )



    def create(
        self,
        db:Session,
        user:User
    ):

        db.add(user)

        db.commit()

        db.refresh(user)

        return user



    def delete(
        self,
        db:Session,
        user:User
    ):

        db.delete(user)

        db.commit()