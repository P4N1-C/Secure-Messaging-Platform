import { fetchWithAuth } from './client';
import type { Conversation } from '@/types';

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetchWithAuth('/conversations');
  return res.json();
}

export async function createGroup(name: string, userIds: number[]): Promise<Conversation> {
  const res = await fetchWithAuth('/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'group', name, user_ids: userIds }),
  });
  return res.json();
}

export async function createDirectConversation(userId: number): Promise<Conversation> {
  const res = await fetchWithAuth('/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'direct', user_ids: [userId] }),
  });
  return res.json();
}

export async function addMember(conversationId: number, userId: number): Promise<any> {
  const res = await fetchWithAuth(`/conversations/${conversationId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

export async function removeMember(conversationId: number, userId: number): Promise<any> {
  const res = await fetchWithAuth(`/conversations/${conversationId}/members/${userId}`, {
    method: 'DELETE',
  });
  return res.json();
}
