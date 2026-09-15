import asyncio

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from app.auth.dependencies import get_current_user
from app.controller.auth_controller import router as auth_router
from app.controller.export_controller import router as export_router
from app.controller.file_controller import router as file_router
from app.controller.user_controller import router
from app.schema.response import ApiResponse



app=FastAPI()



app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_methods=["*"],

    allow_headers=["*"],
    allow_credentials=True,

)
app.include_router(router)
app.include_router(auth_router)
app.include_router(file_router)
app.include_router(export_router)


@app.get("/sse/demo")
async def sse_demo(current_user=Depends(get_current_user)):
    async def generate():
        for chunk in ("这是", "一个", "SSE", "流式", "输出", "示例"):
            yield f"event: message\ndata: {chunk}\n\n"
            await asyncio.sleep(0.3)
        yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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
        ).model_dump(),
        headers=exc.headers,
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
