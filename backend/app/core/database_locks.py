import hashlib

from sqlalchemy import text
from sqlalchemy.orm import Session


def generate_email_lock_key(email: str) -> int:
    """Generate a deterministic PostgreSQL advisory lock key."""

    normalized_email = email.strip().lower()

    lock_identifier = (
        f"incidentops:account:{normalized_email}"
    )

    digest = hashlib.sha256(
        lock_identifier.encode("utf-8")
    ).digest()

    lock_key = int.from_bytes(
        digest[:8],
        byteorder="big",
        signed=True
    )

    return lock_key


def acquire_email_lock(db: Session, email: str) -> None:
    """Acquire a transaction-level advisory lock for an email."""

    lock_key = generate_email_lock_key(email)

    db.execute(
        text(
            "SELECT pg_advisory_xact_lock(:lock_key)"
        ),
        {"lock_key": lock_key}
    )