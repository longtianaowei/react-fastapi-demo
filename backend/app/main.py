from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.controller.export_controller import router as export_router
from app.controller.file_controller import router as file_router
from app.controller.user_controller import router
from app.database import Base,engine
from app.schema.response import ApiResponse



Base.metadata.create_all(
    bind=engine
)


app=FastAPI()



app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_methods=["*"],

    allow_headers=["*"]

)
app.include_router(router)
app.include_router(file_router)
app.include_router(export_router)


@app.exception_handler(HTTPException)
def http_exception_handler(
    request:Request,
    exc:HTTPException
):

    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse.error(
            code=exc.status_code,
            message=str(exc.detail)
        ).model_dump()
    )


@app.exception_handler(RequestValidationError)
def validation_exception_handler(
    request:Request,
    exc:RequestValidationError
):

    return JSONResponse(
        status_code=422,
        content=jsonable_encoder(
            ApiResponse.error(
                code=422,
                data=exc.errors(),
                message="请求参数校验失败"
            )
        )
    )


@app.exception_handler(Exception)
def exception_handler(
    request:Request,
    exc:Exception
):

    return JSONResponse(
        status_code=500,
        content=ApiResponse.error(
            code=500,
            message="服务器内部错误"
        ).model_dump()
    )


@app.get(
    "/hello",
    response_model=ApiResponse[str]
)
def index():

    return ApiResponse.success(
        data="FastAPI hello world"
    )
