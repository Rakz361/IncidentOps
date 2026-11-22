from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.admin import (
    UserRoleUpdate,
    UserStatusUpdate
)
from app.core.database import get_db
from app.core.dependencies import require_roles
from app.core.roles import UserRole
from app.models.models import User
from app.schemas.auth import UserResponse


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get(
    "/users",
    response_model=list[UserResponse]
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    users = db.query(User).order_by(User.id.asc()).all()

    return users


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Prevent an Admin from changing their own role
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )

    # Prevent demoting the last active Admin
    if(
    user.is_active
    and user.role == UserRole.ADMIN.value
    and role_data.role != UserRole.ADMIN
    ):
        active_admin_count = db.query(User).filter(
            User.role == UserRole.ADMIN.value,
            User.is_active == True
        ).count()

        if active_admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the last active Admin"
            )

    user.role = role_data.role.value

    db.commit()
    db.refresh(user)

    return user


@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Prevent Admin from deactivating their own account
    if user.id == current_user.id and not status_data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account"
        )

    # Prevent deactivation of the last active Admin
    if (
        user.is_active
        and user.role == UserRole.ADMIN.value
        and not status_data.is_active
    ):
        active_admin_count = db.query(User).filter(
            User.role == UserRole.ADMIN.value,
            User.is_active == True
        ).count()

        if active_admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot deactivate the last active Admin"
            )

    user.is_active = status_data.is_active

    db.commit()
    db.refresh(user)

    return user


