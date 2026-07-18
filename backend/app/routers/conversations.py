from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models import User, Conversation, ConversationMember, Message, MessageStatus
from app.schemas import ConversationResponse, ConversationCreate, MessageResponse, MessageCreate, MemberAddRequest, MemberResponse
from app.auth import get_current_user
from app.services.conversation_helpers import build_member_response, create_and_broadcast_system_message
from app.services.conversation_queries import get_conversations_query, get_messages_query

router = APIRouter()

@router.get("", response_model=List[ConversationResponse])
async def get_conversations(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_conversations_query(db, current_user)

@router.post("", response_model=ConversationResponse)
async def create_conversation(conv: ConversationCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if conv.type not in ['direct', 'group']:
        raise HTTPException(status_code=400, detail="Invalid conversation type")
        
    user_ids = set(conv.user_ids)
    user_ids.add(current_user.id)
    
    if conv.type == 'direct' and len(user_ids) != 2:
        raise HTTPException(status_code=400, detail="Direct conversations must have exactly 2 users")
        
    users_result = await db.execute(select(User).filter(User.id.in_(user_ids)))
    db_users = users_result.scalars().all()
    if len(db_users) != len(user_ids):
        raise HTTPException(status_code=400, detail="One or more users not found")

    db_conv = Conversation(
        type=conv.type,
        name=conv.name if conv.type == 'group' else None,
        created_by=current_user.id
    )
    db.add(db_conv)
    await db.commit()
    await db.refresh(db_conv)
    
    db_members = []
    for uid in user_ids:
        role = 'admin' if uid == current_user.id and conv.type == 'group' else 'member'
        member = ConversationMember(
            conversation_id=db_conv.id,
            user_id=uid,
            role=role
        )
        db.add(member)
        db_members.append((member, uid))
        
    await db.commit()
    
    last_sys_msg = None
    if conv.type == 'group':
        for uid in user_ids:
            if uid == current_user.id:
                continue
            u = next(user for user in db_users if user.id == uid)
            system_msg_content = f"{current_user.display_name} added {u.display_name}"
            last_sys_msg = await create_and_broadcast_system_message(
                db=db,
                conversation_id=db_conv.id,
                content=system_msg_content,
                member_ids=list(user_ids),
                exclude_user_id=current_user.id
            )

    member_responses = []
    for mem, uid in db_members:
        u = next(user for user in db_users if user.id == uid)
        member_responses.append(build_member_response(mem, u))
    
    conv_resp = ConversationResponse.model_validate(db_conv)
    conv_resp.members = member_responses
    conv_resp.unread_count = 0
    
    if last_sys_msg:
        conv_resp.last_message = MessageResponse.model_validate(last_sys_msg)

    return conv_resp

@router.get("/{id}/messages", response_model=List[MessageResponse])
async def get_messages(id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), limit: int = 50, offset: int = 0):
    return await get_messages_query(db, id, current_user, limit, offset)

@router.post("/{id}/messages", response_model=MessageResponse)
async def send_message(id: int, message: MessageCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    member_query = select(ConversationMember).filter(
        ConversationMember.conversation_id == id,
        ConversationMember.user_id == current_user.id
    )
    member_result = await db.execute(member_query)
    if not member_result.scalars().first():
        raise HTTPException(status_code=403, detail={"type": "error", "detail": "not_a_member"})
        
    db_message = Message(
        conversation_id=id,
        sender_id=current_user.id,
        content=message.content
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    
    all_members_query = select(ConversationMember.user_id).filter(
        ConversationMember.conversation_id == id,
        ConversationMember.user_id != current_user.id
    )
    all_members_result = await db.execute(all_members_query)
    other_member_ids = all_members_result.scalars().all()
    
    for uid in other_member_ids:
        status = MessageStatus(
            message_id=db_message.id,
            user_id=uid,
            status='sent'
        )
        db.add(status)
        
    await db.commit()
    return db_message

@router.post("/{id}/members", response_model=MemberResponse)
async def add_member(id: int, request: MemberAddRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    member_query = select(ConversationMember).filter(
        ConversationMember.conversation_id == id,
        ConversationMember.user_id == current_user.id
    )
    member_result = await db.execute(member_query)
    current_member = member_result.scalars().first()
    
    if not current_member or current_member.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can add members")
        
    new_member_query = select(ConversationMember).filter(
        ConversationMember.conversation_id == id,
        ConversationMember.user_id == request.user_id
    )
    if (await db.execute(new_member_query)).scalars().first():
        raise HTTPException(status_code=400, detail="User is already a member")
        
    db_member = ConversationMember(
        conversation_id=id,
        user_id=request.user_id,
        role='member'
    )
    db.add(db_member)
    await db.commit()
    await db.refresh(db_member)
    
    new_user_query = select(User).filter(User.id == request.user_id)
    new_user = (await db.execute(new_user_query)).scalars().first()

    member_resp = build_member_response(db_member, new_user) if new_user else MemberResponse.model_validate(db_member)

    system_msg_content = f"{current_user.display_name} added {new_user.display_name if new_user else 'a member'}"
    
    all_members_query = select(ConversationMember.user_id).filter(
        ConversationMember.conversation_id == id
    )
    all_members_result = await db.execute(all_members_query)
    member_ids = all_members_result.scalars().all()
    
    await create_and_broadcast_system_message(
        db=db,
        conversation_id=id,
        content=system_msg_content,
        member_ids=member_ids,
        exclude_user_id=None
    )

    return member_resp

@router.delete("/{id}/members/{user_id}")
async def remove_member(id: int, user_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    member_query = select(ConversationMember).filter(
        ConversationMember.conversation_id == id,
        ConversationMember.user_id == current_user.id
    )
    member_result = await db.execute(member_query)
    current_member = member_result.scalars().first()
    
    if not current_member or current_member.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can remove members")
        
    target_member_query = select(ConversationMember).filter(
        ConversationMember.conversation_id == id,
        ConversationMember.user_id == user_id
    )
    target_member = (await db.execute(target_member_query)).scalars().first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    target_user_query = select(User).filter(User.id == user_id)
    target_user = (await db.execute(target_user_query)).scalars().first()
    
    await db.delete(target_member)
    await db.flush()
    
    all_members_query = select(ConversationMember.user_id).filter(
        ConversationMember.conversation_id == id
    )
    all_members_result = await db.execute(all_members_query)
    remaining_member_ids = all_members_result.scalars().all()
    
    system_msg_content = f"{current_user.display_name} removed {target_user.display_name if target_user else 'a member'}"
    
    await create_and_broadcast_system_message(
        db=db,
        conversation_id=id,
        content=system_msg_content,
        member_ids=remaining_member_ids + [user_id],
        exclude_user_id=None,
        broadcast_member_ids=remaining_member_ids
    )
    
    from app.routers.websockets import manager
    await manager.send_to_user(user_id, {"type": "removed_from_group", "conversation_id": id})
    
    return {"message": "Member removed"}
