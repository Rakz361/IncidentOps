from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_access_token
from app.core.websocket_manager import manager
from app.models.models import User


router = APIRouter()


@router.websocket("/ws/incidents")
async def incidents_websocket(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    # Step 1: Verify the JWT token
    payload = verify_access_token(token)

    if not payload or not payload.get("sub"):
        await websocket.close(code=1008)
        return

    # Step 2: Extract the user ID
    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        await websocket.close(code=1008)
        return

    # Step 3: Check whether the user exists and is active
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user or not user.is_active:
        await websocket.close(code=1008)
        return

    # Step 4: Establish the WebSocket connection
    await manager.connect(websocket)

    try:
        # Keep the connection alive
        while True:
            message = await websocket.receive_text()

            print(f"Received WebSocket message: {message}")

            if message == "ping":
                print("Sending pong response...")

                await websocket.send_json({
                    "event": "pong"
                })

                print("Pong response sent successfully")

    except WebSocketDisconnect:
        print(f"User {user.id} disconnected")

    finally:
        manager.disconnect(websocket)