from typing import Generic, TypeVar

from pydantic import BaseModel


T=TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):

    code:int=0

    data:T|None=None

    message:str="success"


    @classmethod
    def success(
        cls,
        data:T|None=None,
        message:str="success"
    ):

        return cls(
            code=0,
            data=data,
            message=message
        )


    @classmethod
    def error(
        cls,
        code:int,
        message:str,
        data:T|None=None
    ):

        return cls(
            code=code,
            data=data,
            message=message
        )
