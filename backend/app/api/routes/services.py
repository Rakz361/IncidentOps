
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.core.roles import UserRole
from app.models.models import User, Service
from app.schemas.service import (
    ServiceCreate,
    ServiceResponse,
    ServiceUpdate
)

router = APIRouter(
    prefix="/services",
    tags=["Services"]
)


@router.post("/", response_model=ServiceResponse, status_code=201)
def create_service(
    service_data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    existing_service = db.query(Service).filter(
        Service.name == service_data.name
    ).first()

    if existing_service:
        raise HTTPException(
            status_code=409,
            detail="Service already exists"
        )

    new_service = Service(
        name=service_data.name,
        description=service_data.description
    )

    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return new_service


# Get all services
@router.get("/", response_model=list[ServiceResponse])
def get_all_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    services = db.query(Service).order_by(Service.id.asc()).all()

    return services


# Get a single service by ID
@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = db.query(Service).filter(
        Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    return service


# Update an existing service
@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    service = db.query(Service).filter(
        Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    update_data = service_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    if "name" in update_data:
        if update_data["name"] is None:
            raise HTTPException(
                status_code=422,
                detail="Service name cannot be null"
            )

        existing_service = db.query(Service).filter(
            Service.name == update_data["name"],
            Service.id != service_id
        ).first()

        if existing_service:
            raise HTTPException(
                status_code=409,
                detail="Another service already uses this name"
            )

    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    return service


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    service = db.query(Service).filter(
        Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    db.delete(service)
    db.commit()

    return {
        "message": "Service deleted successfully"
    }

