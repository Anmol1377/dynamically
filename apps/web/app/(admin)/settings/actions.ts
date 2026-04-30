'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@/lib/db/client';
import { settings, apiKeys } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/require';
import { generateApiKey } from '@/lib/api/auth';

const SettingsSchema = z.object({
  siteName: z.string().min(1).max(120),
  publicReadEnabled: z.boolean(),
});

export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = SettingsSchema.safeParse({
    siteName: ((formData.get('siteName') as string | null) ?? '').trim(),
    publicReadEnabled: formData.get('publicReadEnabled') === 'on',
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  const now = new Date();
  await db
    .insert(settings)
    .values({ id: 1, ...parsed.data, updatedAt: now })
    .onConflictDoUpdate({
      target: settings.id,
      set: { ...parsed.data, updatedAt: now },
    });

  revalidatePath('/settings');
}

const CreateKeySchema = z.object({
  name: z.string().min(1).max(120),
  scope: z.enum(['read', 'preview']),
});

export async function createApiKeyAction(input: {
  name: string;
  scope: 'read' | 'preview';
}): Promise<{ plain: string; prefix: string; id: string }> {
  const user = await requireAdmin();
  const parsed = CreateKeySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  const { plain, hash, prefix } = generateApiKey(parsed.data.scope);
  const id = createId();
  await db.insert(apiKeys).values({
    id,
    name: parsed.data.name,
    keyHash: hash,
    keyPrefix: prefix,
    scope: parsed.data.scope,
    createdByUserId: user.id,
  });

  revalidatePath('/settings');
  return { plain, prefix, id };
}

export async function deleteApiKeyAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id') as string | null;
  if (!id) throw new Error('Missing id');
  await db.delete(apiKeys).where(eq(apiKeys.id, id));
  revalidatePath('/settings');
}
