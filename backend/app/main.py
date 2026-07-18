from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, contacts, conversations, websockets

app = FastAPI(title="Secure Messaging Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
app.include_router(websockets.router, prefix="/ws", tags=["websockets"])
@app.get("/")
def read_root():
    return {"status": "ok"}
