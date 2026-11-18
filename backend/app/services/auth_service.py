
from sqlalchemy.orm import Session

from app.models.models import User
from app.schemas.auth import UserRegister
from app.core.security import hash_password, verify_password


def register_user(db: Session, user_data: UserRegister):
    """Register a new user."""

    email = user_data.email.lower()

    # Check whether the email already exists
    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise ValueError("Email is already registered")

    # Hash the password
    hashed_password = hash_password(user_data.password)

    # Create the user
    new_user = User(
        full_name=user_data.full_name,
        email=email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
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
