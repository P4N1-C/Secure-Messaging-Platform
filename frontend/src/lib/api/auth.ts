import { fetchWithAuth } from './client';
import type { User } from '@/types';

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetchWithAuth('/users/me');
  return res.json();
}
