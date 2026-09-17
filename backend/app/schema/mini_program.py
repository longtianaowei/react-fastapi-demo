from pydantic import BaseModel, Field


class MiniProgramLoginRequest(BaseModel):
    code: str = Field(min_length=1, max_length=512)
    nickname: str | None = Field(default=None, max_length=50)
    avatar_url: str | None = Field(default=None, max_length=500)


class MiniProgramRefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=512)
