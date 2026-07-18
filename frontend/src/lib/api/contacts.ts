import { fetchWithAuth } from './client';
import type { Contact } from '@/types';

export async function fetchContacts(): Promise<Contact[]> {
  const res = await fetchWithAuth('/contacts');
  return res.json();
}

export async function addContact(userId: number): Promise<Contact> {
  const res = await fetchWithAuth('/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ contact_user_id: userId }),
  });
  return res.json();
}
