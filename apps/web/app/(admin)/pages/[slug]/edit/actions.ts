'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq, and, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@/lib/db/client';
import { pages, contentValues } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/require';
import { fieldsExistOnPage, getPageFieldIds } from '@/lib/content/loader';

const SaveDraftSchema = z.object({
  pageId: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
});

export type SaveDraftResult = {
  ok: boolean;
  savedAt: number;
  error?: string;
};

export async function saveDraftAction(input: {
  pageId: string;
  values: Record<string, unknown>;
}): Promise<SaveDraftResult> {
  const user = await requireUser();
  const parsed = SaveDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, savedAt: 0, error: 'Invalid input' };

  const fieldIds = Object.keys(parsed.data.values);
  if (fieldIds.length === 0) return { ok: true, savedAt: Date.now() };

  const valid = await fieldsExistOnPage(parsed.data.pageId, fieldIds);

  const now = new Date();
  db.transaction((tx) => {
    for (const fieldId of fieldIds) {
      if (!valid.has(fieldId)) continue;
      const value = parsed.data.values[fieldId];
      tx.insert(contentValues)
        .values({
          id: createId(),
          fieldId,
          version: 'draft',
          value,
          updatedByUserId: user.id,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [contentValues.fieldId, contentValues.version],
          set: { value, updatedAt: now, updatedByUserId: user.id },
        })
        .run();
    }
  });

  return { ok: true, savedAt: now.getTime() };
}

export async function publishPageAction(input: { pageId: string; pageSlug: string }): Promise<void> {
  const user = await requireUser();
  if (!input.pageId) throw new Error('Missing pageId');

  const fieldIds = await getPageFieldIds(input.pageId);

  const drafts = fieldIds.length
    ? await db
        .select()
        .from(contentValues)
        .where(
          and(eq(contentValues.version, 'draft'), inArray(contentValues.fieldId, fieldIds))
        )
        .all()
    : [];

  const now = new Date();
  db.transaction((tx) => {
    for (const d of drafts) {
      tx.insert(contentValues)
        .values({
          id: createId(),
          fieldId: d.fieldId,
          version: 'published',
          value: d.value,
          updatedByUserId: user.id,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [contentValues.fieldId, contentValues.version],
          set: { value: d.value, updatedAt: now, updatedByUserId: user.id },
        })
        .run();
    }

    tx.update(pages).set({ status: 'published', updatedAt: now }).where(eq(pages.id, input.pageId)).run();
  });

  revalidatePath('/pages');
  revalidatePath(`/pages/${input.pageSlug}/edit`);
}

export async function discardDraftAction(input: { pageId: string; pageSlug: string }): Promise<void> {
  await requireUser();
  if (!input.pageId) throw new Error('Missing pageId');

  const fieldIds = await getPageFieldIds(input.pageId);
  if (fieldIds.length === 0) return;

  await db
    .delete(contentValues)
    .where(and(eq(contentValues.version, 'draft'), inArray(contentValues.fieldId, fieldIds)));

  revalidatePath(`/pages/${input.pageSlug}/edit`);
}
