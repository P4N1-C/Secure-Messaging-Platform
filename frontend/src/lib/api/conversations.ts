import { fetchWithAuth } from './client';
import type { Conversation } from '@/types';

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetchWithAuth('/conversations');
  return res.json();
}
