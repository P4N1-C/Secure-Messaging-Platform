import { fetchWithAuth } from './client';
import type { Message } from '@/types';

export async function fetchMessages(conversationId: number): Promise<Message[]> {
  const res = await fetchWithAuth(`/conversations/${conversationId}/messages`);
  const data = await res.json();
  // Backend returns newest first, so we reverse for chronological order
  if (Array.isArray(data)) {
    return data.reverse();
  }
  return [];
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  const res = await fetchWithAuth(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}
