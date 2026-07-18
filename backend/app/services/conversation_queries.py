from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
from typing import List
from fastapi import HTTPException
from app.models import User, Conversation, ConversationMember, Message, MessageStatus
from app.schemas import ConversationResponse, MessageResponse
from app.services.conversation_helpers import build_member_response

async def get_conversations_query(db: AsyncSession, current_user: User) -> List[ConversationResponse]:
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
            member_responses.append(build_member_response(member, user))
            
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

async def get_messages_query(db: AsyncSession, conversation_id: int, current_user: User, limit: int = 50, offset: int = 0) -> List[MessageResponse]:
    conv_query = (
        select(Conversation).distinct()
        .outerjoin(ConversationMember)
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .outerjoin(MessageStatus, MessageStatus.message_id == Message.id)
        .filter(
            Conversation.id == conversation_id,
            (
                (ConversationMember.user_id == current_user.id) |
                (Message.sender_id == current_user.id) |
                (MessageStatus.user_id == current_user.id)
            )
        )
    )
    conv_result = await db.execute(conv_query)
    if not conv_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not a member of this conversation")
        
    member_query = select(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    )
    is_current_member = (await db.execute(member_query)).scalars().first() is not None

    if is_current_member:
        messages_query = (
            select(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
            .offset(offset)
        )
    else:
        messages_query = (
            select(Message).distinct()
            .outerjoin(MessageStatus, MessageStatus.message_id == Message.id)
            .filter(
                Message.conversation_id == conversation_id,
                (Message.sender_id == current_user.id) | (MessageStatus.user_id == current_user.id)
            )
            .order_by(desc(Message.created_at))
            .limit(limit)
            .offset(offset)
        )
        
    messages_result = await db.execute(messages_query)
    messages = messages_result.scalars().all()
    
    if not messages:
        return []
        
    message_ids = [m.id for m in messages]
    status_query = select(MessageStatus).filter(MessageStatus.message_id.in_(message_ids))
    status_result = await db.execute(status_query)
    all_statuses = status_result.scalars().all()
    
    status_map = {}
    for st in all_statuses:
        if st.message_id not in status_map:
            status_map[st.message_id] = {}
        status_map[st.message_id][st.user_id] = st.status
        
    responses = []
    for msg in messages:
        msg_resp = MessageResponse.model_validate(msg)
        st_dict = status_map.get(msg.id, {})
        
        if msg.sender_id == current_user.id:
            st_list = list(st_dict.values())
            if "read" in st_list:
                msg_resp.status = "read"
            elif "delivered" in st_list:
                msg_resp.status = "delivered"
            elif st_list:
                msg_resp.status = "sent"
        else:
            msg_resp.status = st_dict.get(current_user.id, "sent")
            
        responses.append(msg_resp)
    
    return responses
