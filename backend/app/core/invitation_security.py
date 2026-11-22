import secrets
import hashlib

from datetime import datetime, timedelta, timezone


INVITATION_EXPIRY_HOURS = 24


def generate_invitation_token() -> str:
    """
    Generate a cryptographically secure
    URL-safe invitation token.
    """
    return secrets.token_urlsafe(32)


def hash_invitation_token(token: str) -> str:
    """
    Convert the invitation token into
    a SHA-256 hexadecimal hash.
    """
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def get_invitation_expiry() -> datetime:
    """
    Calculate the invitation expiration
    timestamp in UTC.
    """
    return datetime.now(timezone.utc) + timedelta(
        hours=INVITATION_EXPIRY_HOURS
    )


def is_invitation_expired(expires_at: datetime) -> bool:
    """
    Check whether the invitation has expired.
    """
    return datetime.now(timezone.utc) >= expires_at