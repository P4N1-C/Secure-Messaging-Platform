from fastapi import WebSocket
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import ConversationMember

class ConnectionManager:
    def __init__(self):
        # Maps user_id to active WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)

    async def broadcast_to_conversation(self, conversation_id: int, message: dict, db: AsyncSession, exclude_user_id: int = None):
        # Get all members of the conversation
        result = await db.execute(
            select(ConversationMember.user_id)
            .filter(ConversationMember.conversation_id == conversation_id)
        )
        member_ids = result.scalars().all()

        for member_id in member_ids:
            if member_id == exclude_user_id:
                continue
            await self.send_to_user(member_id, message)
