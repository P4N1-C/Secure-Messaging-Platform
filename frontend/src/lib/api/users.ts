import { fetchWithAuth } from './client';
import type { User } from '@/types';

export async function searchUsers(query: string): Promise<User[]> {
  const res = await fetchWithAuth(`/users/search?q=${encodeURIComponent(query)}`);
  return res.json();
}
