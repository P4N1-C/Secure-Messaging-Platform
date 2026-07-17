PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  password_hash TEXT,
  last_seen DATETIME,
  is_online BOOLEAN DEFAULT 0,
  created_at DATETIME
);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  contact_user_id INTEGER REFERENCES users(id),
  created_at DATETIME,
  UNIQUE(user_id, contact_user_id)
);

CREATE TABLE conversations (
  id INTEGER PRIMARY KEY,
  type TEXT CHECK(type IN ('direct','group')) NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME
);

CREATE TABLE conversation_members (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  user_id INTEGER REFERENCES users(id),
  role TEXT CHECK(role IN ('admin','member')) DEFAULT 'member',
  joined_at DATETIME,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at DATETIME
);

CREATE TABLE message_status (
  id INTEGER PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id),
  user_id INTEGER REFERENCES users(id),
  status TEXT CHECK(status IN ('sent','delivered','read')) DEFAULT 'sent',
  updated_at DATETIME,
  UNIQUE(message_id, user_id)
);

-- Indexes for frequently queried foreign key columns
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_conversation_members_user ON conversation_members(user_id);
CREATE INDEX idx_conversation_members_conversation ON conversation_members(conversation_id);
CREATE INDEX idx_message_status_message ON message_status(message_id);
