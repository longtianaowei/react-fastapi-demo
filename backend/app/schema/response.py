from typing import Generic, TypeVar

from pydantic import BaseModel


T=TypeVar("T")


class PageData(BaseModel, Generic[T]):

    items:list[T]

    total:int

    page:int

    page_size:int

    total_pages:int

    has_next:bool

    has_prev:bool


    @classmethod
    def create(
        cls,
        items:list[T],
        total:int,
        page:int,
        page_size:int
    ):

        total_pages=(total+page_size-1)//page_size

        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page<total_pages,
            has_prev=page>1
        )


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
