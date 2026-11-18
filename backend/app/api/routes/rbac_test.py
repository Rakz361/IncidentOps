
from fastapi import APIRouter, Depends

from app.core.dependencies import require_roles
from app.models.models import User
from app.core.roles import UserRole

router = APIRouter(
    prefix="/rbac-test",
    tags=["RBAC Testing"]
)


# Only Admins can access this endpoint
@router.get("/admin-only")
def admin_only(
    current_user: User = Depends(require_roles(UserRole.ADMIN.value))
):
    return {
        "message": "Admin access granted!",
        "user": current_user.full_name,
        "role": current_user.role
    }


# Admins and Incident Commanders can access this endpoint
@router.get("/incident-management")
def incident_management(
    current_user: User = Depends(
        require_roles(UserRole.ADMIN.value, UserRole.INCIDENT_COMMANDER.value)
    )
):
    return {
        "message": "Incident management access granted!",
        "user": current_user.full_name,
        "role": current_user.role
    }
