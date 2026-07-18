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
}

export interface Message {
  id: number | string;
  content: string;
  created_at: string;
  sender_id: number;
  isFailed?: boolean;
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  members: Member[];
  last_message?: Message;
  unread_count: number;
}
