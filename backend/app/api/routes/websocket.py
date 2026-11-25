import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import verify_access_token
from app.core.websocket_manager import manager
from app.models.models import User

router = APIRouter()

logger = logging.getLogger(__name__)

AUTH_TIMEOUT = 5
SESSION_CHECK_INTERVAL = 20
MAX_AUTH_MESSAGE_LENGTH = 8192


def validate_session(token: str) -> int | None:
    """Validate the JWT and confirm the user is active."""

    payload = verify_access_token(token)

    if not payload or not payload.get("sub"):
        return None

    if not payload.get("exp"):
        return None

    try:
        user_id = int(payload["sub"])

    except (ValueError, TypeError):
        return None

    # Short-lived database session
    with SessionLocal() as db:

        user = (
            db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
        )

        if not user:
            return None

        return user.id


@router.websocket("/ws/incidents")
async def incidents_websocket(websocket: WebSocket):

    # Step 1: Validate the frontend origin
    origin = websocket.headers.get("origin")

    if origin != settings.FRONTEND_URL:
        await websocket.close(code=1008)
        return

    # Step 2: Accept the WebSocket transport
    await websocket.accept()

    try:

        # Step 3: Receive authentication within 5 seconds
        try:
            auth_message = await asyncio.wait_for(
                websocket.receive_text(), timeout=AUTH_TIMEOUT
            )

        except asyncio.TimeoutError:
            await websocket.close(code=1008, reason="Authentication timeout")
            return

        # Step 4: Validate authentication message size
        if len(auth_message) > MAX_AUTH_MESSAGE_LENGTH:
            await websocket.close(code=1009, reason="Message too large")
            return

        # Step 5: Parse authentication message
        import json

        try:
            auth_data = json.loads(auth_message)

        except (ValueError, TypeError):
            await websocket.close(code=1008, reason="Invalid authentication message")
            return

        if (
            not isinstance(auth_data, dict)
            or auth_data.get("type") != "authenticate"
            or not isinstance(auth_data.get("token"), str)
            or not auth_data.get("token")
        ):
            await websocket.close(code=1008, reason="Authentication required")
            return

        token = auth_data["token"]

        # Step 6: Validate JWT and active user
        user_id = await run_in_threadpool(validate_session, token)

        if user_id is None:
            await websocket.close(code=1008, reason="Invalid or expired session")
            return

        # Step 7: Confirm successful authentication
        await websocket.send_json({"event": "authenticated"})

        # Step 8: Register authenticated connection
        await manager.connect(websocket)

        # Step 9: Maintain and periodically validate session
        loop = asyncio.get_running_loop()

        next_session_check = loop.time() + SESSION_CHECK_INTERVAL

        while True:

            remaining_time = max(0, next_session_check - loop.time())

            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(), timeout=remaining_time
                )

            except asyncio.TimeoutError:
                message = None

            # Revalidate periodically, even without messages
            if loop.time() >= next_session_check:

                active_user_id = await run_in_threadpool(validate_session, token)

                if active_user_id != user_id:

                    manager.disconnect(websocket)

                    await websocket.close(
                        code=1008, reason="Session expired or inactive"
                    )
                    return

                next_session_check = loop.time() + SESSION_CHECK_INTERVAL

            # Heartbeat response
            if message == "ping":

                await websocket.send_json({"event": "pong"})

    except WebSocketDisconnect:
        pass

    except Exception:

        logger.error("WebSocket session failed")

        manager.disconnect(websocket)

        try:
            await websocket.close(code=1011, reason="Internal server error")

        except (RuntimeError, WebSocketDisconnect, OSError):
            pass

    finally:
        manager.disconnect(websocket)
