"""initial database baseline

Revision ID: 41e6d82b0e3f
Revises:
Create Date: 2026-11-22 19:48:08.374191

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Revision identifiers
revision: str = "41e6d82b0e3f"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the original IncidentOps database schema."""

    # ==========================================
    # 1. USERS TABLE
    # ==========================================

    op.create_table(
        "users",

        sa.Column("id", sa.Integer(), nullable=False),

        sa.Column(
            "full_name", sa.String(100), nullable=False
        ),

        sa.Column(
            "email", sa.String(255), nullable=False
        ),

        sa.Column(
            "hashed_password", sa.String(255), nullable=False
        ),

        sa.Column(
            "role", sa.String(30), nullable=False
        ),

        sa.Column(
            "is_active", sa.Boolean(), nullable=True
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True
        ),

        sa.PrimaryKeyConstraint("id")
    )

    op.create_index(
        "ix_users_id",
        "users",
        ["id"],
        unique=False
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True
    )

    # ==========================================
    # 2. SERVICES TABLE
    # ==========================================

    op.create_table(
        "services",

        sa.Column("id", sa.Integer(), nullable=False),

        sa.Column(
            "name", sa.String(100), nullable=False
        ),

        sa.Column(
            "description", sa.String(500), nullable=True
        ),

        sa.Column(
            "is_active", sa.Boolean(), nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint("name")
    )

    op.create_index(
        "ix_services_id",
        "services",
        ["id"],
        unique=False
    )

    # ==========================================
    # 3. INCIDENTS TABLE
    # ==========================================

    op.create_table(
        "incidents",

        sa.Column("id", sa.Integer(), nullable=False),

        sa.Column(
            "title", sa.String(200), nullable=False
        ),

        sa.Column(
            "description", sa.String(2000), nullable=True
        ),

        sa.Column(
            "severity", sa.String(10), nullable=False
        ),

        sa.Column(
            "status", sa.String(30), nullable=False
        ),

        sa.Column(
            "service_id", sa.Integer(), nullable=False
        ),

        sa.Column(
            "assigned_to_id", sa.Integer(), nullable=True
        ),

        sa.Column(
            "created_by_id", sa.Integer(), nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True
        ),

        sa.Column(
            "resolved_at",
            sa.DateTime(timezone=True),
            nullable=True
        ),

        sa.ForeignKeyConstraint(
            ["service_id"], ["services.id"]
        ),

        sa.ForeignKeyConstraint(
            ["assigned_to_id"], ["users.id"]
        ),

        sa.ForeignKeyConstraint(
            ["created_by_id"], ["users.id"]
        ),

        sa.PrimaryKeyConstraint("id")
    )

    op.create_index(
        "ix_incidents_id",
        "incidents",
        ["id"],
        unique=False
    )

    op.create_index(
        "ix_incidents_service_id",
        "incidents",
        ["service_id"],
        unique=False
    )

    # ==========================================
    # 4. ALERTS TABLE
    # ==========================================

    op.create_table(
        "alerts",

        sa.Column("id", sa.Integer(), nullable=False),

        sa.Column(
            "dedup_key", sa.String(255), nullable=False
        ),

        sa.Column(
            "source", sa.String(100), nullable=False
        ),

        sa.Column(
            "title", sa.String(200), nullable=False
        ),

        sa.Column(
            "description", sa.String(2000), nullable=True
        ),

        sa.Column(
            "severity", sa.String(10), nullable=False
        ),

        sa.Column(
            "service_id", sa.Integer(), nullable=False
        ),

        sa.Column(
            "incident_id", sa.Integer(), nullable=True
        ),

        sa.Column(
            "payload", sa.JSON(), nullable=True
        ),

        sa.Column(
            "occurrence_count", sa.Integer(), nullable=False
        ),

        sa.Column(
            "first_received_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False
        ),

        sa.Column(
            "last_received_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["service_id"], ["services.id"]
        ),

        sa.ForeignKeyConstraint(
            ["incident_id"], ["incidents.id"]
        ),

        sa.PrimaryKeyConstraint("id")
    )

    op.create_index(
        "ix_alerts_id",
        "alerts",
        ["id"],
        unique=False
    )

    op.create_index(
        "ix_alerts_dedup_key",
        "alerts",
        ["dedup_key"],
        unique=True
    )

    op.create_index(
        "ix_alerts_service_id",
        "alerts",
        ["service_id"],
        unique=False
    )


def downgrade() -> None:
    """Remove the original IncidentOps database schema."""

    op.drop_table("alerts")

    op.drop_table("incidents")

    op.drop_table("services")

    op.drop_table("users")