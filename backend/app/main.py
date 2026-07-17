from fastapi import FastAPI
from app.routers import auth, users, contacts, conversations, websockets

app = FastAPI(title="Secure Messaging Platform API")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
app.include_router(websockets.router, prefix="/ws", tags=["websockets"])
@app.get("/")
def read_root():
    return {"status": "ok"}
