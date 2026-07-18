from fastapi import WebSocket
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, List
from app.models import ConversationMember
class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active WebSocket connections
        self.active_connections: Dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            # Create a copy to avoid modification during iteration
            for websocket in list(self.active_connections[user_id]):
                try:
                    await websocket.send_json(message)
                except Exception:
                    # Connection might be closed, handled by disconnect
                    pass

    async def broadcast_to_conversation(
        self, 
        conversation_id: int, 
        message: dict, 
        db: AsyncSession, 
        exclude_user_id: int = None,
        member_ids: List[int] = None
    ):
        if member_ids is None:
            # Fallback if member_ids not provided
            result = await db.execute(
                select(ConversationMember.user_id)
                .filter(ConversationMember.conversation_id == conversation_id)
            )
            member_ids = result.scalars().all()

        for member_id in member_ids:
            if member_id == exclude_user_id:
                continue
            await self.send_to_user(member_id, message)
