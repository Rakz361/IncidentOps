
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.roles import UserRole
from app.models.models import User, Service, Incident
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse
)
from app.core.websocket_manager import manager

router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"]
)


@router.post(
    "/",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_incident(
    incident_data: IncidentCreate,
     background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.INCIDENT_COMMANDER
        )
    )
):
    # Check whether the selected service exists
    service = db.query(Service).filter(
        Service.id == incident_data.service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    if not service.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot create an incident for an inactive service"
        )

    # Validate assigned responder, if provided
    if incident_data.assigned_to_id is not None:
        responder = db.query(User).filter(
            User.id == incident_data.assigned_to_id
        ).first()

        if not responder or not responder.is_active:
            raise HTTPException(
                status_code=404,
                detail="Active responder not found"
            )

        if responder.role != UserRole.RESPONDER.value:
            raise HTTPException(
                status_code=400,
                detail="Assigned user must have the Responder role"
            )

    # Create the incident
    new_incident = Incident(
        title=incident_data.title,
        description=incident_data.description,
        severity=incident_data.severity,
        service_id=incident_data.service_id,
        assigned_to_id=incident_data.assigned_to_id,
        created_by_id=current_user.id
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    background_tasks.add_task(
    manager.broadcast,
    {
        "event": "incident_created",
        "data": {
            "id": new_incident.id,
            "title": new_incident.title,
            "severity": new_incident.severity,
            "status": new_incident.status,
            "service_id": new_incident.service_id,
            "assigned_to_id": new_incident.assigned_to_id,
            "created_by_id": new_incident.created_by_id
        }
    }
    )
    return new_incident


@router.get("/", response_model=list[IncidentResponse])
def get_all_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incidents = db.query(Incident).order_by(
        Incident.created_at.desc()
    ).all()

    return incidents


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_by_id(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(
        Incident.id == incident_id
    ).first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return incident



@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    incident_data: IncidentUpdate,
     background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.INCIDENT_COMMANDER
        )
    )
):
    # Find the incident
    incident = db.query(Incident).filter(
        Incident.id == incident_id
    ).first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    # Extract only the fields provided by the user
    update_data = incident_data.model_dump(
        exclude_unset=True
    )

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    # Validate fields that cannot be null
    for field in ["title", "severity", "status", "service_id"]:
        if field in update_data and update_data[field] is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null"
            )

    # Validate service if service_id is being updated
    if "service_id" in update_data:
        service = db.query(Service).filter(
            Service.id == update_data["service_id"]
        ).first()

        if not service:
            raise HTTPException(
                status_code=404,
                detail="Service not found"
            )

        if not service.is_active:
            raise HTTPException(
                status_code=400,
                detail="Cannot assign incident to an inactive service"
            )

    # Validate responder if assigned_to_id is being updated
    if (
        "assigned_to_id" in update_data
        and update_data["assigned_to_id"] is not None
    ):
        responder = db.query(User).filter(
            User.id == update_data["assigned_to_id"]
        ).first()

        if not responder or not responder.is_active:
            raise HTTPException(
                status_code=404,
                detail="Active responder not found"
            )

        if responder.role != UserRole.RESPONDER.value:
            raise HTTPException(
                status_code=400,
                detail="Assigned user must have the Responder role"
            )

    # Update incident fields
    for field, value in update_data.items():
        setattr(incident, field, value)

    # Maintain resolution timestamp
    if "status" in update_data:
        if update_data["status"] == "resolved":
            incident.resolved_at = datetime.now(timezone.utc)
        else:
            incident.resolved_at = None

    db.commit()
    db.refresh(incident)


    background_tasks.add_task(
    manager.broadcast,
    {
        "event": "incident_updated",
        "data": {
            "id": incident.id,
            "title": incident.title,
            "severity": incident.severity,
            "status": incident.status,
            "service_id": incident.service_id,
            "assigned_to_id": incident.assigned_to_id,
            "updated_at": (
                incident.updated_at.isoformat()
                if incident.updated_at
                else None
            )
        }
    }
    )

    return incident


@router.delete("/{incident_id}")
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    # Find the incident
    incident = db.query(Incident).filter(
        Incident.id == incident_id
    ).first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    # Delete the incident
    db.delete(incident)
    db.commit()

    return {
        "message": "Incident deleted successfully"
    }



