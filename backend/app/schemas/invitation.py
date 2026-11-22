from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.core.roles import UserRole


class InvitationCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    role: UserRole = UserRole.VIEWER


class InvitationResponse(BaseModel):
    id: int

    full_name: str

    email: EmailStr

    role: UserRole

    invitation_url: str

    expires_at: datetime

    created_at: datetime

class InvitationVerify(BaseModel):
    token: str = Field(
        min_length=32,
        max_length=256
    )
    
class InvitationVerifyResponse(BaseModel):
    full_name: str

    email: EmailStr

    role: UserRole

    expires_at: datetime


class InvitationAccept(BaseModel):
    token: str = Field(
        min_length=32,
        max_length=256
    )

    password: str = Field(
        min_length=8,
        max_length=128
    )