from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
from typing import List, Optional
from app.database import get_db
from app.models import User, Conversation, ConversationMember, Message, MessageStatus
from app.schemas import ConversationResponse, ConversationCreate, MessageResponse, MessageCreate, MemberAddRequest, UserResponse, MemberResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[ConversationResponse])
async def get_conversations(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = (
        select(Conversation)
        .join(ConversationMember)
        .filter(ConversationMember.user_id == current_user.id)
    )
    result = await db.execute(query)
    conversations = result.scalars().all()
    
    conv_responses = []
    
    for conv in conversations:
        members_query = select(ConversationMember, User).join(User, ConversationMember.user_id == User.id).filter(ConversationMember.conversation_id == conv.id)
        members_result = await db.execute(members_query)
        
        member_responses = []
        for member, user in members_result.all():
            user_resp = UserResponse.model_validate(user)
            member_resp = MemberResponse.model_validate(member)
            member_resp.user = user_resp
            member_responses.append(member_resp)
            
        last_msg_query = (
            select(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_msg_result = await db.execute(last_msg_query)
        last_message = last_msg_result.scalars().first()
        
        unread_query = (
            select(func.count(MessageStatus.id))
            .join(Message, MessageStatus.message_id == Message.id)
            .filter(
                Message.conversation_id == conv.id,
                MessageStatus.user_id == current_user.id,
                MessageStatus.status != 'read'
            )
        )
        unread_result = await db.execute(unread_query)
        unread_count = unread_result.scalar() or 0
        
        conv_resp = ConversationResponse.model_validate(conv)
        conv_resp.members = member_responses
        if last_message:
            conv_resp.last_message = MessageResponse.model_validate(last_message)
        conv_resp.unread_count = unread_count
        
        conv_responses.append(conv_resp)
        
    conv_responses.sort(
        key=lambda x: x.last_message.created_at if x.last_message else x.created_at,
        reverse=True
    )
    return conv_responses

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
    
    for uid in user_ids:
        role = 'admin' if uid == current_user.id and conv.type == 'group' else 'member'
        member = ConversationMember(
            conversation_id=db_conv.id,
            user_id=uid,
            role=role
        )
        db.add(member)
        
    await db.commit()
    
    conv_resp = ConversationResponse.model_validate(db_conv)
    conv_resp.members = []
    conv_resp.unread_count = 0
    return conv_resp

@router.get("/{id}/messages", response_model=List[MessageResponse])
async def get_messages(id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), limit: int = 50, offset: int = 0):
    member_query = select(ConversationMember).filter(
        ConversationMember.conversation_id == id,
        ConversationMember.user_id == current_user.id
    )
    member_result = await db.execute(member_query)
    if not member_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not a member of this conversation")
        
    messages_query = (
        select(Message)
        .filter(Message.conversation_id == id)
        .order_by(desc(Message.created_at))
        .limit(limit)
        .offset(offset)
    )
    messages_result = await db.execute(messages_query)
    messages = messages_result.scalars().all()
    
    return messages

@router.post("/{id}/messages", response_model=MessageResponse)
async def send_message(id: int, message: MessageCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    member_query = select(ConversationMember).filter(
        ConversationMember.conversation_id == id,
        ConversationMember.user_id == current_user.id
    )
    member_result = await db.execute(member_query)
    if not member_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not a member of this conversation")
        
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
    
    member_resp = MemberResponse.model_validate(db_member)
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
        
    await db.delete(target_member)
    await db.commit()
    return {"message": "Member removed"}
