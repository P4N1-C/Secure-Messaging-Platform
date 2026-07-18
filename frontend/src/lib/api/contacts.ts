import { fetchWithAuth } from './client';
import type { Contact } from '@/types';

export async function fetchContacts(): Promise<Contact[]> {
  const res = await fetchWithAuth('/contacts');
  return res.json();
}
