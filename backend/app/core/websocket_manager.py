from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    # Connect a new user
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

        print(
            f"WebSocket connected. "
            f"Total users: {len(self.active_connections)}"
        )

    # Disconnect a user
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        print(
            f"WebSocket disconnected. "
            f"Total users: {len(self.active_connections)}"
        )

    # Send a message to every connected user
    async def broadcast(self, message: dict):

        for connection in self.active_connections.copy():

            try:
                await connection.send_json(message)

            except (WebSocketDisconnect, RuntimeError):
                self.disconnect(connection)


# Create one shared connection manager
manager = ConnectionManager()