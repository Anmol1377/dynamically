'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { uploads } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/require';
import { deleteUploadById } from '@/lib/uploads/store';

export async function listUploads() {
  await requireUser();
  return db.select().from(uploads).orderBy(desc(uploads.createdAt)).all();
}

const UpdateAltSchema = z.object({
  id: z.string().min(1),
  alt: z.string().max(280),
});

export async function updateUploadAltAction(input: { id: string; alt: string }): Promise<void> {
  await requireUser();
  const parsed = UpdateAltSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  await db.update(uploads).set({ alt: parsed.data.alt }).where(eq(uploads.id, parsed.data.id));
  revalidatePath('/media');
}

export async function deleteUploadAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get('id') as string | null;
  if (!id) throw new Error('Missing id');
  await deleteUploadById(id);
  revalidatePath('/media');
}
