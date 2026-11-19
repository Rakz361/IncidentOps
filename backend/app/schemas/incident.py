
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


# Allowed incident severity levels
SeverityLevel = Literal["P1", "P2", "P3", "P4"]


# Allowed incident statuses
IncidentStatus = Literal[
    "open",
    "investigating",
    "identified",
    "monitoring",
    "resolved"
]


# Schema for creating an incident
class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(
        default=None,
        max_length=2000
    )
    severity: SeverityLevel = "P3"
    service_id: int = Field(gt=0)
    assigned_to_id: int | None = Field(
        default=None,
        gt=0
    )


# Schema for updating an incident
class IncidentUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200
    )
    description: str | None = Field(
        default=None,
        max_length=2000
    )
    severity: SeverityLevel | None = None
    status: IncidentStatus | None = None
    service_id: int | None = Field(
        default=None,
        gt=0
    )
    assigned_to_id: int | None = Field(
        default=None,
        gt=0
    )


# Schema for returning incident information
class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str | None
    severity: str
    status: str
    service_id: int
    assigned_to_id: int | None
    created_by_id: int
    created_at: datetime | None
    updated_at: datetime | None
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
