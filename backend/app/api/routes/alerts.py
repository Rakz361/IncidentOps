import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, Header
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alert_service import process_alert


router = APIRouter(
    prefix="/webhooks",
    tags=["Webhooks"]
)


@router.post(
    "/alerts",
    response_model=AlertResponse,
    status_code=201
)
def receive_alert(
    alert_data: AlertCreate,
    response: Response,
    x_webhook_token: str | None = Header(default=None),
    db: Session = Depends(get_db)
):

    # 1. Verify webhook authentication
    if (
        not x_webhook_token
        or not secrets.compare_digest(
            x_webhook_token,
            settings.WEBHOOK_SECRET
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing webhook token"
        )

    # 2. Process the alert
    try:
        alert, is_duplicate = process_alert(
            db=db,
            alert_data=alert_data
        )

        if is_duplicate:
            response.status_code = 200

        return alert

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )