import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './session';
import type { User } from '@/lib/db/schema';

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/dashboard');
  return user;
}
