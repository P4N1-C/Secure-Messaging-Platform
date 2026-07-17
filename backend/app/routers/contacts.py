from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from typing import List
from app.database import get_db
from app.models import User, Contact
from app.schemas import ContactResponse, ContactCreate
from app.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[ContactResponse])
async def get_contacts(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Contact).filter(Contact.user_id == current_user.id)
    result = await db.execute(query)
    contacts = result.scalars().all()
    
    contact_user_ids = [c.contact_user_id for c in contacts]
    if contact_user_ids:
        users_result = await db.execute(select(User).filter(User.id.in_(contact_user_ids)))
        users_map = {u.id: u for u in users_result.scalars().all()}
        
        for contact in contacts:
            contact.contact_user = users_map.get(contact.contact_user_id)
            
    return contacts

@router.post("", response_model=ContactResponse)
async def create_contact(contact: ContactCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if contact.contact_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")
        
    user_result = await db.execute(select(User).filter(User.id == contact.contact_user_id))
    contact_user = user_result.scalars().first()
    if not contact_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_contact = Contact(
        user_id=current_user.id,
        contact_user_id=contact.contact_user_id
    )
    db.add(db_contact)
    try:
        await db.commit()
        await db.refresh(db_contact)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Contact already exists")
        
    db_contact.contact_user = contact_user
    return db_contact
