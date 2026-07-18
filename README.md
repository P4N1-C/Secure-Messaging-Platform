<div align="center">

# 🔐 Secure Messaging Platform

A functional Signal-style secure messaging application built as a full-stack clone.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-black?style=for-the-badge&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Local Setup](#-local-setup)
- [Database Schema](#-database-schema)
- [Seed Data & Mock Auth](#-seed-data--mock-auth)
- [API Overview](#-api-overview)
- [Assumptions & Known Limitations](#️-assumptions--known-limitations)

---

## ✨ Features

| Category | Details |
|---|---|
| 🔑 **Authentication** | Mocked phone-based registration + OTP verification, login, logout, and session persistence (JWT) |
| 👥 **Contacts** | Search by username or phone number (partial matching) to find and message any user. Add to contacts directly from the chat header card |
| 💬 **Messaging** | Real-time 1:1 and group messaging via native WebSockets with a REST fallback. Message persistence, delivery/read receipts (✓/✓✓), typing indicators, unread badges |
| 🧑‍🤝‍🧑 **Groups** | Create groups, add/remove members (admin-only), group system messages (e.g. *"Alice added Bob"*). Removed members keep read-only access to history |
| 🎨 **UI/UX** | Signal-inspired responsive two-pane layout (collapses to single pane on mobile), dark mode, keyboard shortcuts (`Enter` to send, `Shift+Enter` for newline), toast notifications |
| 🚧 **Placeholders** | Voice/video calls, stories, and linked devices shown as "Coming Soon" per assignment scope |

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | Next.js (App Router, TypeScript) + Tailwind CSS | |
| **Backend** | FastAPI + SQLAlchemy (async) | |
| **Database** | SQLite (local dev) → PostgreSQL / Neon (production) | Render/Railway free tiers use ephemeral filesystems — a local SQLite file gets wiped on every restart/redeploy, so production needed managed, persistent Postgres |
| **Real-time** | Native WebSockets (`fastapi.WebSocket`) | Deliberate choice over Socket.io — sufficient for this project's scale without needing an external pub-sub layer like Redis |
| **Deployment** | Render (backend) · Vercel (frontend) · Neon (Postgres) | |

---

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd signal-clone
```

### 2. Backend Setup
```bash
cd backend
```
Create a `.env` file:
```env
DATABASE_URL=sqlite+aiosqlite:///./signal_clone.db
SECRET_KEY=your-local-secret-key
```
Install and run:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
```
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```
Install and run:
```bash
npm install
npm run dev
```

### 4. Seed the database
From the `backend/` directory:
```bash
python -m app.seed
```

> **Note:** Both `.env` and `.env.local` are gitignored — no need to share or commit them.

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  phone TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  password_hash TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  contact_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, contact_user_id)
);

CREATE TABLE conversations (
  id INTEGER PRIMARY KEY,
  type TEXT CHECK(type IN ('direct','group')) NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE conversation_members (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  user_id INTEGER REFERENCES users(id),
  role TEXT CHECK(role IN ('admin','member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE message_status (
  id INTEGER PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id),
  user_id INTEGER REFERENCES users(id),
  status TEXT CHECK(status IN ('sent','delivered','read')) DEFAULT 'sent',
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(message_id, user_id)
);
```

> 💡 **Why `message_status` is a separate table:** In a group chat, each message has a distinct read/delivered state *per recipient*. A single `status` column on `messages` only works for 1:1 chats — breaking it out ensures correct delivery and read receipts across every group member.

---

## 🌱 Seed Data & Mock Auth

| | |
|---|---|
| 🔢 **Mock OTP Code** | `123456` |

**Seeded users, ready for testing:**

| Name | Phone | Username |
|---|---|---|
| Alice Smith | `+911234567890` | alice |
| Bob Jones | `+919876543210` | bob |
| Charlie Brown | `+911122334455` | — |
| Diana Prince | `+915556667777` | — |
| Eve Adams | `+919998887777` | — |

---

## 🔌 API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/verify-otp` | Verify OTP and issue a session JWT |
| `POST` | `/auth/login` | Initiate login for an existing user |
| `GET` | `/users/me` | Get the currently authenticated user's profile |
| `GET` | `/users/search` | Search for users by username or phone number |
| `GET` | `/contacts` | Fetch the user's saved contacts |
| `POST` | `/contacts` | Add a user to the contact list |
| `GET` | `/conversations` | List active conversations (last message + unread count) |
| `POST` | `/conversations` | Create a new 1:1 or group conversation |
| `POST` | `/conversations/{id}/members` | Add a member to a group *(admin only)* |
| `DELETE` | `/conversations/{id}/members/{user_id}` | Remove a member from a group *(admin only)* |
| `GET` | `/conversations/{id}/messages` | Fetch message history for a conversation |
| `POST` | `/conversations/{id}/messages` | Send a message via REST fallback |
| `WS` | `/ws/{token}` | Real-time messaging, typing events, and receipts |

---

## ⚠️ Assumptions & Known Limitations

- **Primary Identifier** — Phone number is required (username optional), mirroring Signal's real UX even though SMS verification itself is mocked.
- **Authentication** — OTP relies on a hardcoded mock value (`123456`) instead of real SMS delivery.
- **Security** — End-to-end encryption is simulated/mocked per assignment allowance; messages are stored in plaintext.
- **WebSocket Auth** — The auth token is passed via the URL path (`/ws/{token}`) rather than a header, since the native browser WebSocket API can't send custom headers without an additional client library. A production app would use ticket-based auth or WebSocket subprotocols instead.
- **Development Warnings** — A WebSocket console error (`WS error {}`) may occasionally appear in local dev. This is a known, cosmetic side-effect of React Strict Mode's intentional double-invoke of `useEffect`, closing the initial connection prematurely. The connection self-recovers and remains functional.
- **Free Tier Cold Starts** — Render's free tier spins down after inactivity; the first request after idle time may take 30-50 seconds.
- **Deferred Group Features** — Leaving a group voluntarily and promoting other members to admin were considered but kept out of scope, to stay within the assignment's explicit "add/remove members" requirement.