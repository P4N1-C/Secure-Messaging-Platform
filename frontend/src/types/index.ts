export interface User {
  id: number;
  phone: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Member {
  id: number;
  user: User;
  role?: string;
}

export interface Contact {
  id: number;
  user_id: number;
  contact_user_id: number;
  created_at: string;
  contact_user: User;
}

export interface Message {
  id: number | string;
  content: string;
  created_at: string;
  sender_id?: number | null;
  isFailed?: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  members: Member[];
  last_message?: Message;
  unread_count: number;
  created_at?: string;
}
