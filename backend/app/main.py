from fastapi import FastAPI

from app.database import Base,engine

from app.controller.user_controller import router



Base.metadata.create_all(
    bind=engine
)


app=FastAPI()

from fastapi.middleware.cors import CORSMiddleware



app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_methods=["*"],

    allow_headers=["*"]

)
app.include_router(router)



@app.get("/hello")
def index():

    return {
        "message":"FastAPI hello world"
    }