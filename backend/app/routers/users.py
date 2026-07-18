from fastapi import APIRouter, Depends, Query
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from app.models import User
from app.schemas import UserResponse
from app.auth import get_current_user
from app.database import get_db

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    search_term = f"%{q}%"
    query = select(User).filter(
        User.id != current_user.id,
        or_(
            User.username.ilike(search_term),
            User.phone.ilike(search_term)
        )
    ).limit(50)
    result = await db.execute(query)
    users = result.scalars().all()
    return users
