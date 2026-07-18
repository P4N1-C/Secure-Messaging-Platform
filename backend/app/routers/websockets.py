from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import JWTError, jwt
import json
from app.database import get_db
from app.models import User, Message, MessageStatus, ConversationMember, utcnow
from app.auth import SECRET_KEY, ALGORITHM
from app.websocket_manager import ConnectionManager
from app.schemas import MessageResponse

router = APIRouter()

manager = ConnectionManager()

@router.websocket("/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: AsyncSession = Depends(get_db)):
    # Authenticate token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = int(user_id_str)
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify user exists
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Register connection
    await manager.connect(user_id, websocket)

    # Mark user online
    user.is_online = True
    await db.commit()

    try:
        while True:
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type")
            
            if event_type == "send_message":
                conversation_id = event.get("conversation_id")
                content = event.get("content")
                
                if not conversation_id or not content:
                    continue
                    
                # Verify user is in conversation
                mem_res = await db.execute(
                    select(ConversationMember)
                    .filter(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == user_id)
                )
                if not mem_res.scalars().first():
                    await manager.send_to_user(user_id, {"type": "error", "detail": "not_a_member"})
                    continue

                # Insert message
                new_msg = Message(
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    content=content
                )
                db.add(new_msg)
                await db.flush() # to get new_msg.id
                
                # Insert message status for other members
                all_mem_res = await db.execute(
                    select(ConversationMember.user_id)
                    .filter(ConversationMember.conversation_id == conversation_id)
                )
                member_ids = all_mem_res.scalars().all()
                
                for mid in member_ids:
                    if mid != user_id:
                        db.add(MessageStatus(
                            message_id=new_msg.id,
                            user_id=mid,
                            status="sent"
                        ))
                
                await db.commit()
                await db.refresh(new_msg)

                # Broadcast new message
                msg_dict = {
                    "id": new_msg.id,
                    "conversation_id": new_msg.conversation_id,
                    "sender_id": new_msg.sender_id,
                    "content": new_msg.content,
                    "created_at": new_msg.created_at.isoformat()
                }
                
                broadcast_payload = {
                    "type": "new_message",
                    "message": msg_dict
                }
                
                # Send to all members except sender
                await manager.broadcast_to_conversation(
                    conversation_id=conversation_id,
                    message=broadcast_payload,
                    db=db,
                    exclude_user_id=user_id,
                    member_ids=member_ids
                )
                
                # Send confirmed message back to sender for optimistic UI reconciliation
                await manager.send_to_user(user_id, broadcast_payload)

            elif event_type == "typing":
                conversation_id = event.get("conversation_id")
                if not conversation_id:
                    continue
                    
                broadcast_payload = {
                    "type": "typing",
                    "conversation_id": conversation_id,
                    "user_id": user_id
                }
                await manager.broadcast_to_conversation(
                    conversation_id=conversation_id,
                    message=broadcast_payload,
                    db=db,
                    exclude_user_id=user_id
                )

            elif event_type == "mark_read":
                message_id = event.get("message_id")
                if not message_id:
                    continue
                
                # Update status
                status_res = await db.execute(
                    select(MessageStatus)
                    .filter(MessageStatus.message_id == message_id, MessageStatus.user_id == user_id)
                )
                msg_status = status_res.scalars().first()
                if msg_status:
                    msg_status.status = "read"
                    await db.commit()
                    
                    # Also need conversation_id to broadcast
                    msg_res = await db.execute(select(Message).filter(Message.id == message_id))
                    msg = msg_res.scalars().first()
                    
                    if msg:
                        broadcast_payload = {
                            "type": "read_receipt",
                            "message_id": message_id,
                            "user_id": user_id,
                            "status": "read",
                            "conversation_id": msg.conversation_id
                        }
                        await manager.broadcast_to_conversation(
                            conversation_id=msg.conversation_id,
                            message=broadcast_payload,
                            db=db,
                            exclude_user_id=user_id
                        )

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        # Update user offline status if no other connections exist
        if not manager.active_connections.get(user_id):
            user.is_online = False
            user.last_seen = utcnow()
            await db.commit()
    except Exception as e:
        import traceback
        traceback.print_exc()
        manager.disconnect(user_id, websocket)
        if not manager.active_connections.get(user_id):
            user.is_online = False
            user.last_seen = utcnow()
            await db.commit()
