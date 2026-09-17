from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    identifier: str = Field(
        min_length=1,
        max_length=100,
        validation_alias=AliasChoices("identifier", "email", "username"),
    )
    password: str = Field(min_length=8, max_length=128)

    model_config = ConfigDict(extra="forbid")


class WebTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MiniProgramTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str


class CurrentUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    avatar_url: str | None = None
    roles: list[str] = []
    permissions: list[str] = []

    model_config = ConfigDict(from_attributes=True)
