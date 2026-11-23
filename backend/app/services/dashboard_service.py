from datetime import datetime, timezone, timedelta

from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.models.models import Incident, Service

from app.schemas.dashboard import (
    DashboardSummary,
    SeverityBreakdown,
    DashboardServiceHealth,
    DashboardRecentIncident,
    DashboardResponse
)


def get_dashboard_stats(db: Session) -> DashboardResponse:

    now = datetime.now(timezone.utc)

    today_start = now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    tomorrow_start = today_start + timedelta(days=1)

    # Unresolved incident condition
    unresolved_condition = (
        func.lower(Incident.status).notin_(
            ["resolved", "closed"]
        )
    )

    # 1. Incident summary statistics
    incident_summary = db.query(
        func.count(Incident.id).label("total_incidents"),

        func.count(
            case(
                (unresolved_condition, Incident.id)
            )
        ).label("open_incidents"),

        func.count(
            case(
                (
                    Incident.resolved_at >= today_start,
                    case(
                        (
                            Incident.resolved_at < tomorrow_start,
                            Incident.id
                        )
                    )
                )
            )
        ).label("resolved_today")

    ).one()

    # Active services count
    active_services = db.query(
        func.count(Service.id)
    ).filter(
        Service.is_active.is_(True)
    ).scalar() or 0

    summary = DashboardSummary(
        total_incidents=incident_summary.total_incidents,
        open_incidents=incident_summary.open_incidents,
        resolved_today=incident_summary.resolved_today,
        active_services=active_services
    )

       # 2. Active incident severity breakdown
    severity_rows = db.query(
        Incident.severity,
        func.count(Incident.id)
    ).filter(
        unresolved_condition
    ).group_by(
        Incident.severity
    ).filter(
    unresolved_condition
).all()

    severity_counts = {
        "P1": 0,
        "P2": 0,
        "P3": 0,
        "P4": 0
    }

    for severity, count in severity_rows:
        if severity in severity_counts:
            severity_counts[severity] = count

    severity_breakdown = SeverityBreakdown(
        **severity_counts
    )

    # 3. Unresolved incidents grouped by service
    health_rows = db.query(
        Incident.service_id,

        func.count(
            Incident.id
        ).label("unresolved_count"),

        func.count(
            case(
                (Incident.severity == "P1", Incident.id)
            )
        ).label("critical_count")

    ).filter(
        unresolved_condition
    ).group_by(
        Incident.service_id
    ).all()

    health_lookup = {
        row.service_id: row
        for row in health_rows
    }

    # Retrieve services
    services = db.query(Service).order_by(
        Service.name.asc()
    ).all()

    service_health = []

    for service in services:

        health = health_lookup.get(service.id)

        if not service.is_active:
            status = "Inactive"

        elif health and health.critical_count > 0:
            status = "Major Outage"

        elif health and health.unresolved_count > 0:
            status = "Degraded"

        else:
            status = "Operational"

        service_health.append(
            DashboardServiceHealth(
                id=service.id,
                name=service.name,
                is_active=service.is_active,
                status=status
            )
        )

    # 4. Retrieve five most recently created incidents
    recent_rows = db.query(
        Incident,
        Service.name.label("service_name")

    ).join(
        Service,
        Incident.service_id == Service.id

    ).order_by(
        Incident.created_at.desc(),
        Incident.id.desc()

    ).limit(5).all()

    recent_incidents = [
        DashboardRecentIncident(
            id=incident.id,
            title=incident.title,
            service_id=incident.service_id,
            service_name=service_name,
            severity=incident.severity,
            status=incident.status,
            created_at=incident.created_at
        )
        for incident, service_name in recent_rows
    ]

    # 5. Return complete Dashboard response
    return DashboardResponse(
        summary=summary,
        severity_breakdown=severity_breakdown,
        service_health=service_health,
        recent_incidents=recent_incidents,
        reporting_timezone="UTC",
        generated_at=now
    )