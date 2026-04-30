'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { ensureSettingsRow, isSetupComplete, markSetupComplete } from '@/lib/auth/setup-state';

const SetupSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetupFormState = {
  errors?: Record<string, string[]>;
  formError?: string;
};

export async function setupAction(_prev: SetupFormState, formData: FormData): Promise<SetupFormState> {
  await ensureSettingsRow();
  if (await isSetupComplete()) {
    redirect('/login');
  }

  const parsed = SetupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const userId = createId();
  const passwordHash = await hashPassword(password);

  try {
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
    });
  } catch {
    return { formError: 'Could not create user. Try a different email.' };
  }

  await markSetupComplete();
  const { token, expiresAt } = await createSession(userId);
  await setSessionCookie(token, expiresAt);

  redirect('/dashboard');
}
