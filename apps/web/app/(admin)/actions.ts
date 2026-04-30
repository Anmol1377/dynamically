'use server';

import { redirect } from 'next/navigation';
import { clearSessionCookie, getSessionToken, invalidateSession } from '@/lib/auth/session';

export async function logoutAction() {
  const token = await getSessionToken();
  if (token) await invalidateSession(token);
  await clearSessionCookie();
  redirect('/login');
}
