from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    phone: str
    username: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None

class LoginRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    phone: str
    username: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class ContactCreate(BaseModel):
    contact_user_id: int

class ContactResponse(BaseModel):
    id: int
    user_id: int
    contact_user_id: int
    created_at: datetime
    contact_user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    created_at: datetime
    status: Optional[str] = None

    class Config:
        from_attributes = True

class MemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    type: str # 'direct' or 'group'
    name: Optional[str] = None
    user_ids: List[int] = []

class ConversationResponse(BaseModel):
    id: int
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: int
    created_at: datetime
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    members: Optional[List[MemberResponse]] = None

    class Config:
        from_attributes = True

class MemberAddRequest(BaseModel):
    user_id: int
