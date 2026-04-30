import 'server-only';
import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function isSetupComplete(): Promise<boolean> {
  const row = await db.select().from(settings).where(eq(settings.id, 1)).get();
  return Boolean(row?.setupComplete);
}

export async function ensureSettingsRow(): Promise<void> {
  const row = await db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!row) {
    await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
  }
}

export async function markSetupComplete(): Promise<void> {
  const now = new Date();
  await db
    .insert(settings)
    .values({ id: 1, setupComplete: true, updatedAt: now })
    .onConflictDoUpdate({
      target: settings.id,
      set: { setupComplete: true, updatedAt: now },
    });
}
