import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, Header, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alert_service import process_alert

from app.core.websocket_manager import manager

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/alerts", response_model=AlertResponse, status_code=201)
def receive_alert(
    alert_data: AlertCreate,
    response: Response,
    background_tasks: BackgroundTasks,
    x_webhook_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):

    # 1. Verify webhook authentication
    if not x_webhook_token or not secrets.compare_digest(
        x_webhook_token, settings.WEBHOOK_SECRET
    ):
        raise HTTPException(status_code=401, detail="Invalid or missing webhook token")

    # 2. Process the alert
    try:
        alert, is_duplicate = process_alert(db=db, alert_data=alert_data)

        if is_duplicate:
            response.status_code = 200

        elif alert.incident_id is not None:
            background_tasks.add_task(
                manager.broadcast,
                {
                    "event": "incident_created",
                    "data": {
                        "id": alert.incident_id,
                        "title": alert.title,
                        "severity": alert.severity,
                        "status": "open",
                        "service_id": alert.service_id,
                        "assigned_to_id": None,
                        "source": alert.source,
                    },
                },
            )

        return alert

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
