import logging

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    # Register an authenticated WebSocket
    async def connect(self, websocket: WebSocket):

        if websocket not in self.active_connections:
            self.active_connections.append(websocket)

        logger.info(
            "Authenticated WebSocket connected. Total users: %s",
            len(self.active_connections),
        )

    # Remove a disconnected WebSocket
    def disconnect(self, websocket: WebSocket):

        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

            logger.info(
                "WebSocket disconnected. Total users: %s", len(self.active_connections)
            )

    # Broadcast to authenticated connections only
    async def broadcast(self, message: dict):

        for connection in self.active_connections.copy():

            try:
                await connection.send_json(message)

            except (WebSocketDisconnect, RuntimeError, OSError):
                self.disconnect(connection)


# Shared connection manager
manager = ConnectionManager()
