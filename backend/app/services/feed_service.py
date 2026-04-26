from fastapi import WebSocket
from typing import Dict, List
import json


class ConnectionManager:
    """Manages WebSocket connections for real-time feed updates."""

    def __init__(self):
        # user_id -> list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            data = json.dumps(message, default=str)
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(data)
                except Exception:
                    pass

    async def broadcast_to_followers(self, follower_ids: List[int], message: dict):
        for uid in follower_ids:
            await self.send_to_user(uid, message)


manager = ConnectionManager()
