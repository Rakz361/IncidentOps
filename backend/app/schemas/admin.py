
from pydantic import BaseModel

from app.core.roles import UserRole


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserStatusUpdate(BaseModel):
    is_active: bool
