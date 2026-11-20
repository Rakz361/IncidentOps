from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


SeverityLevel = Literal["P1", "P2", "P3", "P4"]


class AlertCreate(BaseModel):
    dedup_key: str = Field(min_length=1, max_length=255)
    source: str = Field(min_length=2, max_length=100)

    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(
        default=None,
        max_length=2000
    )

    severity: SeverityLevel = "P3"

    service_id: int = Field(gt=0)

    payload: dict | None = None


class AlertResponse(BaseModel):
    id: int
    dedup_key: str
    source: str
    title: str
    description: str | None
    severity: str
    service_id: int
    incident_id: int | None
    payload: dict | None
    occurrence_count: int
    first_received_at: datetime
    last_received_at: datetime

    model_config = ConfigDict(from_attributes=True)