import 'server-only';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '@/lib/db/client';
import { sessions, users, type User } from '@/lib/db/schema';

const SESSION_COOKIE = 'dyn_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RENEW_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

function hashToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const sessionId = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt: Math.floor(expiresAt.getTime() / 1000),
  });

  return { token, expiresAt };
}

export async function validateSessionToken(token: string): Promise<{ user: User; refreshed: boolean } | null> {
  const sessionId = hashToken(token);
  const row = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .get();

  if (!row) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (row.session.expiresAt <= nowSec) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  let refreshed = false;
  const remainingMs = row.session.expiresAt * 1000 - Date.now();
  if (remainingMs < RENEW_THRESHOLD_MS) {
    const newExpiresSec = Math.floor((Date.now() + SESSION_TTL_MS) / 1000);
    await db.update(sessions).set({ expiresAt: newExpiresSec }).where(eq(sessions.id, sessionId));
    refreshed = true;
  }

  return { user: row.user, refreshed };
}

export async function invalidateSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | null> {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const result = await validateSessionToken(token);
  return result?.user ?? null;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
