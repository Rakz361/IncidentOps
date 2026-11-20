
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    func
)

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(String(255), nullable=False)

    role = Column(
        String(30),
        default="viewer",
        nullable=False
    )

    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(String(2000), nullable=True)

    severity = Column(String(10), default="P3", nullable=False)
    status = Column(String(30), default="open", nullable=False)

    service_id = Column(
        Integer,
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )

    assigned_to_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_by_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    resolved_at = Column(DateTime(timezone=True), nullable=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    # Unique identifier used to detect duplicate alerts
    dedup_key = Column(String(255), unique=True, nullable=False, index=True)

    # Monitoring system that generated the alert
    source = Column(String(100), nullable=False)

    # Alert information
    title = Column(String(200), nullable=False)
    description = Column(String(2000), nullable=True)
    severity = Column(String(10), nullable=False)

    # Related service
    service_id = Column(
        Integer,
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )

    # Incident created from this alert
    incident_id = Column(
        Integer,
        ForeignKey("incidents.id"),
        nullable=True
    )

    # Original alert payload
    payload = Column(JSON, nullable=True)

    # Track repeated alerts
    occurrence_count = Column(Integer, default=1, nullable=False)

    first_received_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    last_received_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )