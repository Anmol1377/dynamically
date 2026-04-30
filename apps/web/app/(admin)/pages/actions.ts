'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@/lib/db/client';
import { pages } from '@/lib/db/schema';
import { requireAdmin, requireUser } from '@/lib/auth/require';
import { isValidSlug, slugify } from '@/lib/slug';

const CreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(60)
    .refine(isValidSlug, 'Slug must be lowercase letters, digits, and dashes (start with a letter)'),
});

export type ActionState = {
  ok?: boolean;
  errors?: Record<string, string[]>;
  formError?: string;
};

export async function createPageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const titleRaw = (formData.get('title') as string | null) ?? '';
  const slugInput = (formData.get('slug') as string | null) ?? '';
  const slug = slugInput.trim() ? slugify(slugInput) : slugify(titleRaw);

  const parsed = CreateSchema.safeParse({ title: titleRaw.trim(), slug });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const exists = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, parsed.data.slug)).get();
  if (exists) return { formError: `A page with slug "${parsed.data.slug}" already exists.` };

  await db.insert(pages).values({
    id: createId(),
    slug: parsed.data.slug,
    title: parsed.data.title,
    status: 'draft',
  });

  revalidatePath('/pages');
  redirect(`/pages/${parsed.data.slug}/schema`);
}

const RenameSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).refine(isValidSlug),
});

export async function renamePageAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = RenameSchema.safeParse({
    id: formData.get('id'),
    title: ((formData.get('title') as string | null) ?? '').trim(),
    slug: slugify(((formData.get('slug') as string | null) ?? '').trim()),
  });
  if (!parsed.success) throw new Error('Invalid input');

  const existingSameSlug = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.slug, parsed.data.slug))
    .get();
  if (existingSameSlug && existingSameSlug.id !== parsed.data.id) {
    throw new Error(`Slug "${parsed.data.slug}" is already in use`);
  }

  await db
    .update(pages)
    .set({ title: parsed.data.title, slug: parsed.data.slug, updatedAt: new Date() })
    .where(eq(pages.id, parsed.data.id));

  revalidatePath('/pages');
  revalidatePath(`/pages/${parsed.data.slug}/schema`);
}

export async function deletePageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id') as string | null;
  if (!id) throw new Error('Missing id');

  await db.delete(pages).where(eq(pages.id, id));
  revalidatePath('/pages');
  redirect('/pages');
}

export async function listPages() {
  await requireUser();
  return db.select().from(pages).orderBy(pages.order, pages.createdAt).all();
}
