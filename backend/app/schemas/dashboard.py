from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_incidents: int
    open_incidents: int
    resolved_today: int
    active_services: int


class SeverityBreakdown(BaseModel):
    P1: int = 0
    P2: int = 0
    P3: int = 0
    P4: int = 0


class DashboardServiceHealth(BaseModel):
    id: int
    name: str
    is_active: bool
    status: Literal[
        "Operational",
        "Degraded",
        "Major Outage",
        "Inactive"
    ]


class DashboardRecentIncident(BaseModel):
    id: int
    title: str
    service_id: int
    service_name: str
    severity: str
    status: str
    created_at: datetime


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    severity_breakdown: SeverityBreakdown
    service_health: list[DashboardServiceHealth]
    recent_incidents: list[DashboardRecentIncident]
    reporting_timezone: str = "UTC"
    generated_at: datetime