from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.models import User, UserInvitation
from app.schemas.auth import UserRegister
from app.core.security import hash_password, verify_password
from app.core.database_locks import acquire_email_lock


def register_user(db: Session, user_data: UserRegister):
    """Register a new user with concurrency protection."""

    email = user_data.email.strip().lower()

    try:
        # Acquire transaction-level email lock
        acquire_email_lock(db, email)

        # Check whether the email already exists
        existing_user = db.query(User).filter(
            User.email == email
        ).first()

        if existing_user:
            raise ValueError("Email is already registered")

        # Check whether an active invitation exists
        active_invitation = db.query(UserInvitation).filter(
            UserInvitation.email == email,
            UserInvitation.is_used.is_(False),
            UserInvitation.expires_at > datetime.now(timezone.utc)
        ).first()

        if active_invitation:
            raise ValueError(
                "An active invitation exists for this email. "
                "Please use your invitation link to activate your account."
            )

        # Hash the password
        hashed_password = hash_password(user_data.password)

        # Create the user
        new_user = User(
            full_name=user_data.full_name,
            email=email,
            hashed_password=hashed_password,
            role="viewer",
            is_active=True
        )

        db.add(new_user)
        db.commit()

    except IntegrityError as e:
        db.rollback()

        raise ValueError(
            "Unable to create account due to a database conflict"
        ) from e

    except Exception:
        db.rollback()
        raise

    db.refresh(new_user)

    return new_user


def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user using email and password."""

    email = email.lower()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        return None

    return user