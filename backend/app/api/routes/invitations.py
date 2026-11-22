from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import require_roles
from app.core.roles import UserRole

from app.models.models import User

from app.schemas.invitation import (
    InvitationCreate,
    InvitationResponse,
    InvitationVerify,
    InvitationVerifyResponse,
    InvitationAccept
)

from app.schemas.auth import UserResponse

from app.services.invitation_service import (
    create_invitation,
    verify_invitation,
    accept_invitation
)


router = APIRouter(tags=["Invitations"])




@router.post(
    "/admin/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user_invitation(
    invitation_data: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):

    try:
        invitation, raw_token = create_invitation(
            db=db,
            invitation_data=invitation_data,
            invited_by=current_user.id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )

    # Construct the invitation URL
    invitation_url = (
    f"{settings.FRONTEND_URL}/accept-invitation"
    f"#token={raw_token}"
)

    return InvitationResponse(
        id=invitation.id,
        full_name=invitation.full_name,
        email=invitation.email,
        role=invitation.role,
        invitation_url=invitation_url,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at
    )


@router.post(
    "/invitations/verify",
    response_model=InvitationVerifyResponse,
    status_code=status.HTTP_200_OK
)
def verify_user_invitation(
    invitation_data: InvitationVerify,
    db: Session = Depends(get_db)
):

    try:
        invitation = verify_invitation(
            db=db,
            token=invitation_data.token
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return InvitationVerifyResponse(
        full_name=invitation.full_name,
        email=invitation.email,
        role=invitation.role,
        expires_at=invitation.expires_at
    )


@router.post(
    "/invitations/accept",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def accept_user_invitation(
    invitation_data: InvitationAccept,
    db: Session = Depends(get_db)
):

    try:
        new_user = accept_invitation(
            db=db,
            invitation_data=invitation_data
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return new_user