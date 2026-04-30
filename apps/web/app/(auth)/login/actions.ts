'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { isSetupComplete } from '@/lib/auth/setup-state';
import { clearLoginAttempts, recordLoginAttempt } from '@/lib/auth/rate-limit';

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormState = {
  errors?: Record<string, string[]>;
  formError?: string;
};

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  if (!(await isSetupComplete())) {
    redirect('/setup');
  }

  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateLimitKey = `login:${ip}:${normalizedEmail}`;

  const limit = recordLoginAttempt(rateLimitKey);
  if (!limit.ok) {
    return {
      formError: `Too many login attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).get();

  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    return { formError: 'Invalid email or password' };
  }

  clearLoginAttempts(rateLimitKey);

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  const redirectTo = (formData.get('redirect') as string | null) || '/dashboard';
  redirect(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
}
