from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.models import User, UserInvitation

from app.schemas.invitation import (
    InvitationCreate,
    InvitationAccept
)

from app.core.invitation_security import (
    generate_invitation_token,
    hash_invitation_token,
    get_invitation_expiry,
    is_invitation_expired
)

from app.core.security import hash_password
from app.core.database_locks import acquire_email_lock


def create_invitation(
    db: Session,
    invitation_data: InvitationCreate,
    invited_by: int
) -> tuple[UserInvitation, str]:
    """Create an invitation with concurrency protection."""

    email = str(invitation_data.email).strip().lower()

    try:
        # Acquire transaction-level email lock
        acquire_email_lock(db, email)

        # Check whether the user already exists
        existing_user = db.query(User).filter(
            User.email == email
        ).first()

        if existing_user:
            raise ValueError(
                "Email is already registered"
            )

        # Check whether an active invitation already exists
        existing_invitation = db.query(UserInvitation).filter(
            UserInvitation.email == email,
            UserInvitation.is_used.is_(False),
            UserInvitation.expires_at > datetime.now(timezone.utc)
        ).first()

        if existing_invitation:
            raise ValueError(
                "An active invitation already exists for this email"
            )

        # Generate secure invitation token
        raw_token = generate_invitation_token()

        # Hash the invitation token
        token_hash = hash_invitation_token(raw_token)

        # Create invitation record
        invitation = UserInvitation(
            full_name=invitation_data.full_name.strip(),
            email=email,
            role=invitation_data.role.value,
            token_hash=token_hash,
            invited_by=invited_by,
            is_used=False,
            expires_at=get_invitation_expiry()
        )

        # Save invitation and release the transaction lock
        db.add(invitation)
        db.commit()

    except IntegrityError as e:
        db.rollback()

        raise ValueError(
            "Unable to create invitation due to a database conflict"
        ) from e

    except Exception:
        db.rollback()
        raise

    db.refresh(invitation)

    # Return invitation and original token
    return invitation, raw_token


def verify_invitation(
    db: Session,
    token: str
) -> UserInvitation:
    """Verify whether an invitation is valid."""

    # Hash the received invitation token
    token_hash = hash_invitation_token(token)

    # Find the matching invitation
    invitation = db.query(UserInvitation).filter(
        UserInvitation.token_hash == token_hash
    ).first()

    # Check whether the invitation exists
    if not invitation:
        raise ValueError(
            "Invalid invitation link"
        )

    # Check whether the invitation has already been used
    if invitation.is_used:
        raise ValueError(
            "This invitation has already been used"
        )

    # Check whether the invitation has expired
    if is_invitation_expired(invitation.expires_at):
        raise ValueError(
            "This invitation has expired"
        )

    # Check whether the email is already registered
    existing_user = db.query(User).filter(
        User.email == invitation.email
    ).first()

    if existing_user:
        raise ValueError(
            "Email is already registered"
        )

    # Return the validated invitation
    return invitation


def accept_invitation(
    db: Session,
    invitation_data: InvitationAccept
) -> User:
    """Accept an invitation with concurrency protection."""

    token_hash = hash_invitation_token(
        invitation_data.token
    )

    try:
        # Retrieve the email without locking the invitation row
        invitation_email = db.query(UserInvitation.email).filter(
            UserInvitation.token_hash == token_hash
        ).scalar()

        if invitation_email is None:
            raise ValueError(
                "Invalid invitation link"
            )

        # Acquire email lock before row-level lock
        acquire_email_lock(db, invitation_email)

        # Retrieve and lock the latest invitation record
        invitation = db.query(UserInvitation).filter(
            UserInvitation.token_hash == token_hash
        ).populate_existing().with_for_update().first()

        # Validate invitation existence
        if not invitation:
            raise ValueError(
                "Invalid invitation link"
            )

        # Reject previously used invitations
        if invitation.is_used:
            raise ValueError(
                "This invitation has already been used"
            )

        # Reject expired invitations
        if is_invitation_expired(invitation.expires_at):
            raise ValueError(
                "This invitation has expired"
            )

        # Check whether the email is already registered
        existing_user = db.query(User).filter(
            User.email == invitation.email
        ).first()

        if existing_user:
            raise ValueError(
                "Email is already registered"
            )

        # Hash the user's password
        hashed_password = hash_password(
            invitation_data.password
        )

        # Create the user using invitation details
        new_user = User(
            full_name=invitation.full_name,
            email=invitation.email,
            hashed_password=hashed_password,
            role=invitation.role,
            is_active=True
        )

        db.add(new_user)

        # Mark the invitation as consumed
        invitation.is_used = True

        # Commit both operations together and release locks
        db.commit()

    except IntegrityError as e:
        db.rollback()

        raise ValueError(
            "Unable to create account due to a database conflict"
        ) from e

    except Exception:
        db.rollback()
        raise

    # Retrieve the newly created user
    db.refresh(new_user)

    return new_user