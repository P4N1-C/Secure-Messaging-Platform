import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from app.database import AsyncSessionLocal, engine
from app.models import User, Contact, Conversation, ConversationMember, Message, MessageStatus

async def clear_database(session):
    print("Clearing database...")
    await session.execute(delete(MessageStatus))
    await session.execute(delete(Message))
    await session.execute(delete(ConversationMember))
    await session.execute(delete(Conversation))
    await session.execute(delete(Contact))
    await session.execute(delete(User))
    await session.commit()

async def seed():
    async with AsyncSessionLocal() as session:
        await clear_database(session)

        print("Seeding users...")
        now = datetime.now(timezone.utc)
        users_data = [
            {"username": "alice", "phone": "+911234567890", "display_name": "Alice Smith"},
            {"username": "bob", "phone": "+919876543210", "display_name": "Bob Jones"},
            {"username": None, "phone": "+911122334455", "display_name": "Charlie Brown"},
            {"username": None, "phone": "+915556667777", "display_name": "Diana Prince"},
            {"username": None, "phone": "+919998887777", "display_name": "Eve Adams"}
        ]
        users = []
        for u_data in users_data:
            user = User(
                username=u_data.get("username"),
                phone=u_data["phone"],
                display_name=u_data["display_name"],
                created_at=now - timedelta(days=10)
            )
            session.add(user)
            users.append(user)
        
        await session.commit()
        # Refresh to get IDs
        for user in users:
            await session.refresh(user)
        
        u_alice, u_bob, u_charlie, u_diana, u_eve = users

        print("Seeding contacts...")
        contacts = []
        for u1, u2 in [(u_alice, u_bob), (u_alice, u_charlie), (u_alice, u_diana), (u_bob, u_charlie), (u_bob, u_eve)]:
            contacts.append(Contact(user_id=u1.id, contact_user_id=u2.id))
            contacts.append(Contact(user_id=u2.id, contact_user_id=u1.id))
        
        session.add_all(contacts)
        await session.commit()

        print("Seeding conversations...")
        # 2 Direct Conversations: Alice-Bob, Charlie-Diana
        conv1 = Conversation(type="direct", created_by=u_alice.id, created_at=now - timedelta(days=5))
        conv2 = Conversation(type="direct", created_by=u_charlie.id, created_at=now - timedelta(days=4))
        
        # 1 Group Conversation: Alice, Bob, Charlie, Diana
        conv_group = Conversation(type="group", name="Project Alpha", created_by=u_alice.id, created_at=now - timedelta(days=2))

        session.add_all([conv1, conv2, conv_group])
        await session.commit()
        await session.refresh(conv1)
        await session.refresh(conv2)
        await session.refresh(conv_group)

        print("Seeding conversation members...")
        members = [
            ConversationMember(conversation_id=conv1.id, user_id=u_alice.id),
            ConversationMember(conversation_id=conv1.id, user_id=u_bob.id),
            
            ConversationMember(conversation_id=conv2.id, user_id=u_charlie.id),
            ConversationMember(conversation_id=conv2.id, user_id=u_diana.id),
            
            ConversationMember(conversation_id=conv_group.id, user_id=u_alice.id, role="admin"),
            ConversationMember(conversation_id=conv_group.id, user_id=u_bob.id),
            ConversationMember(conversation_id=conv_group.id, user_id=u_charlie.id),
            ConversationMember(conversation_id=conv_group.id, user_id=u_diana.id),
        ]
        session.add_all(members)
        await session.commit()

        print("Seeding messages...")
        messages = []
        # Alice and Bob chat
        messages.append(Message(conversation_id=conv1.id, sender_id=u_alice.id, content="Hi Bob, how are you?", created_at=now - timedelta(days=1, hours=2)))
        messages.append(Message(conversation_id=conv1.id, sender_id=u_bob.id, content="I'm good Alice, thanks!", created_at=now - timedelta(days=1, hours=1, minutes=50)))
        messages.append(Message(conversation_id=conv1.id, sender_id=u_alice.id, content="Did you finish the task?", created_at=now - timedelta(days=1, hours=1, minutes=40)))
        messages.append(Message(conversation_id=conv1.id, sender_id=u_bob.id, content="Working on it right now.", created_at=now - timedelta(days=1, hours=1, minutes=20)))
        messages.append(Message(conversation_id=conv1.id, sender_id=u_alice.id, content="Great, let me know.", created_at=now - timedelta(days=1, hours=1)))
        
        # Charlie and Diana chat
        messages.append(Message(conversation_id=conv2.id, sender_id=u_charlie.id, content="Diana, are we meeting today?", created_at=now - timedelta(hours=5)))
        messages.append(Message(conversation_id=conv2.id, sender_id=u_diana.id, content="Yes, at 3 PM.", created_at=now - timedelta(hours=4)))
        messages.append(Message(conversation_id=conv2.id, sender_id=u_charlie.id, content="Perfect.", created_at=now - timedelta(hours=3)))
        messages.append(Message(conversation_id=conv2.id, sender_id=u_charlie.id, content="Should I prepare the slides?", created_at=now - timedelta(hours=2, minutes=50)))
        messages.append(Message(conversation_id=conv2.id, sender_id=u_diana.id, content="That would be great, thanks.", created_at=now - timedelta(hours=2, minutes=40)))

        # Group chat
        messages.append(Message(conversation_id=conv_group.id, sender_id=u_alice.id, content="Welcome to the group everyone!", created_at=now - timedelta(days=2)))
        messages.append(Message(conversation_id=conv_group.id, sender_id=u_bob.id, content="Thanks Alice.", created_at=now - timedelta(days=1, hours=23)))
        messages.append(Message(conversation_id=conv_group.id, sender_id=u_charlie.id, content="Hello!", created_at=now - timedelta(days=1, hours=22)))
        messages.append(Message(conversation_id=conv_group.id, sender_id=u_alice.id, content="Let's discuss the new project.", created_at=now - timedelta(hours=10)))
        messages.append(Message(conversation_id=conv_group.id, sender_id=u_diana.id, content="I've reviewed the requirements.", created_at=now - timedelta(hours=9)))
        messages.append(Message(conversation_id=conv_group.id, sender_id=u_bob.id, content="Looks good to me.", created_at=now - timedelta(hours=8)))
        messages.append(Message(conversation_id=conv_group.id, sender_id=u_charlie.id, content="I have a few questions.", created_at=now - timedelta(hours=7)))
        messages.append(Message(conversation_id=conv_group.id, sender_id=u_alice.id, content="Let's jump on a call later.", created_at=now - timedelta(hours=1)))
        
        session.add_all(messages)
        await session.commit()
        for msg in messages:
            await session.refresh(msg)

        print("Seeding message statuses...")
        now_naive = now.replace(tzinfo=None)
        statuses = []
        for msg in messages:
            msg_created_at = msg.created_at.replace(tzinfo=None) if msg.created_at.tzinfo else msg.created_at
            if msg.conversation_id == conv1.id:
                recipient = u_bob if msg.sender_id == u_alice.id else u_alice
                status = "read" if (now_naive - msg_created_at) > timedelta(hours=2) else "delivered"
                statuses.append(MessageStatus(message_id=msg.id, user_id=recipient.id, status=status, updated_at=msg.created_at + timedelta(minutes=1)))
            
            elif msg.conversation_id == conv2.id:
                recipient = u_diana if msg.sender_id == u_charlie.id else u_charlie
                # last message is just sent, others read
                if msg.content.startswith("That would"):
                    status = "sent"
                else:
                    status = "read"
                statuses.append(MessageStatus(message_id=msg.id, user_id=recipient.id, status=status, updated_at=msg.created_at + timedelta(minutes=5)))
            
            elif msg.conversation_id == conv_group.id:
                group_users = [u_alice, u_bob, u_charlie, u_diana]
                for user in group_users:
                    if user.id != msg.sender_id:
                        # mix of statuses based on user and time
                        if (now_naive - msg_created_at) > timedelta(days=1):
                            status = "read"
                        elif user == u_bob:
                            status = "delivered"
                        else:
                            status = "sent"
                        statuses.append(MessageStatus(message_id=msg.id, user_id=user.id, status=status, updated_at=msg.created_at + timedelta(minutes=10)))

        session.add_all(statuses)
        await session.commit()

        print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
