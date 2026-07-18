from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.models import Message, MessageStatus
from app.schemas import UserResponse, MemberResponse
from app.routers.websockets import manager

def build_member_response(member, user) -> MemberResponse:
    user_resp = UserResponse.model_validate(user)
    member_resp = MemberResponse.model_validate(member)
    member_resp.user = user_resp
    return member_resp

async def create_and_broadcast_system_message(
    db: AsyncSession, 
    conversation_id: int, 
    content: str, 
    member_ids: List[int], 
    exclude_user_id: Optional[int] = None,
    broadcast_member_ids: Optional[List[int]] = None
) -> Message:
    sys_msg = Message(
        conversation_id=conversation_id,
        sender_id=None,
        content=content
    )
    db.add(sys_msg)
    await db.flush()
    
    for uid in member_ids:
        db.add(MessageStatus(message_id=sys_msg.id, user_id=uid, status='sent'))
        
    await db.commit()
    await db.refresh(sys_msg)
    
    msg_dict = {
        "id": sys_msg.id,
        "conversation_id": sys_msg.conversation_id,
        "sender_id": sys_msg.sender_id,
        "content": sys_msg.content,
        "created_at": sys_msg.created_at.isoformat()
    }
    
    b_ids = broadcast_member_ids if broadcast_member_ids is not None else member_ids
    
    if b_ids:
        await manager.broadcast_to_conversation(
            conversation_id=conversation_id,
            message={"type": "new_message", "message": msg_dict},
            db=db,
            exclude_user_id=exclude_user_id,
            member_ids=b_ids
        )
        
    return sys_msg
