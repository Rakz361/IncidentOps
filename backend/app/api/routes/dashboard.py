from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import User

from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import get_dashboard_stats


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/stats",
    response_model=DashboardResponse
)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_stats(db)