from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.models import Alert, Incident, Service, User
from app.schemas.alert import AlertCreate


def process_alert(db: Session, alert_data: AlertCreate):

    # 1. Validate that the service exists
    service = db.query(Service).filter(
        Service.id == alert_data.service_id
    ).first()

    if not service:
        raise ValueError("Service not found")

    if not service.is_active:
        raise ValueError("Service is inactive")

    # 2. Acquire a PostgreSQL transaction-level lock
    db.execute(
    text("SELECT pg_advisory_xact_lock(hashtext(:dedup_key))"),
    {"dedup_key": alert_data.dedup_key}
    )

    # 3. Check whether this alert already exists
    existing_alert = db.query(Alert).filter(
    Alert.dedup_key == alert_data.dedup_key
    ).first()

    # 4. Handle duplicate alert
    if existing_alert:

        existing_alert.occurrence_count += 1

        existing_alert.last_received_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(existing_alert)

        return existing_alert, True

    # 5. Find an active Admin to attribute the incident to
    admin_user = db.query(User).filter(
        User.role == "admin",
        User.is_active == True
    ).first()

    if not admin_user:
        raise ValueError(
            "No active Admin user available to create the incident"
        )

    # 6. Create a new alert record
    new_alert = Alert(
        dedup_key=alert_data.dedup_key,
        source=alert_data.source,
        title=alert_data.title,
        description=alert_data.description,
        severity=alert_data.severity,
        service_id=alert_data.service_id,
        payload=alert_data.payload,
        occurrence_count=1
    )

    db.add(new_alert)

    # Generate the alert ID before creating the incident
    db.flush()

    # 7. Automatically create an incident
    new_incident = Incident(
        title=alert_data.title,
        description=alert_data.description,
        severity=alert_data.severity,
        status="open",
        service_id=alert_data.service_id,
        assigned_to_id=None,
        created_by_id=admin_user.id
    )

    db.add(new_incident)

    # Generate the incident ID
    db.flush()

    # 8. Link the alert to its incident
    new_alert.incident_id = new_incident.id

    # 9. Save both records together
    db.commit()

    db.refresh(new_alert)

    return new_alert, False