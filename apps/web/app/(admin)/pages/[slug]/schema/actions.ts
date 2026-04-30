'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq, and, max } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@/lib/db/client';
import { pages, sections, fields } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/require';
import { isValidSlug, slugify } from '@/lib/slug';
import { FIELD_TYPES, getFieldDefinition, type FieldType } from '@/lib/fields/registry';

async function findPageBySlugOrThrow(slug: string) {
  const page = await db.select().from(pages).where(eq(pages.slug, slug)).get();
  if (!page) throw new Error(`Page "${slug}" not found`);
  return page;
}

function revalidatePageSchema(slug: string) {
  revalidatePath(`/pages/${slug}/schema`);
}

const SectionCreateSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).refine(isValidSlug),
});

export async function createSectionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const pageSlugForRevalidate = (formData.get('pageSlug') as string | null) ?? '';

  const parsed = SectionCreateSchema.safeParse({
    pageId: formData.get('pageId'),
    title: ((formData.get('title') as string | null) ?? '').trim(),
    slug: slugify(((formData.get('slug') as string | null) ?? '').trim()),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  const dup = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.pageId, parsed.data.pageId), eq(sections.slug, parsed.data.slug)))
    .get();
  if (dup) throw new Error(`Section slug "${parsed.data.slug}" is already used on this page`);

  const maxOrder = await db
    .select({ max: max(sections.order) })
    .from(sections)
    .where(eq(sections.pageId, parsed.data.pageId))
    .get();
  const nextOrder = (maxOrder?.max ?? -1) + 1;

  await db.insert(sections).values({
    id: createId(),
    pageId: parsed.data.pageId,
    slug: parsed.data.slug,
    title: parsed.data.title,
    order: nextOrder,
  });

  if (pageSlugForRevalidate) revalidatePageSchema(pageSlugForRevalidate);
}

const SectionUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).refine(isValidSlug),
});

export async function updateSectionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const pageSlugForRevalidate = (formData.get('pageSlug') as string | null) ?? '';

  const parsed = SectionUpdateSchema.safeParse({
    id: formData.get('id'),
    title: ((formData.get('title') as string | null) ?? '').trim(),
    slug: slugify(((formData.get('slug') as string | null) ?? '').trim()),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  const current = await db.select().from(sections).where(eq(sections.id, parsed.data.id)).get();
  if (!current) throw new Error('Section not found');

  const dup = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.pageId, current.pageId), eq(sections.slug, parsed.data.slug)))
    .get();
  if (dup && dup.id !== parsed.data.id) {
    throw new Error(`Section slug "${parsed.data.slug}" is already used on this page`);
  }

  await db
    .update(sections)
    .set({ title: parsed.data.title, slug: parsed.data.slug, updatedAt: new Date() })
    .where(eq(sections.id, parsed.data.id));

  if (pageSlugForRevalidate) revalidatePageSchema(pageSlugForRevalidate);
}

export async function deleteSectionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id') as string | null;
  const pageSlug = (formData.get('pageSlug') as string | null) ?? '';
  if (!id) throw new Error('Missing id');

  await db.delete(sections).where(eq(sections.id, id));
  if (pageSlug) revalidatePageSchema(pageSlug);
}

const ReorderSchema = z.object({
  pageId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)),
});

export async function reorderSectionsAction(input: { pageId: string; orderedIds: string[]; pageSlug: string }): Promise<void> {
  await requireAdmin();
  const parsed = ReorderSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  await db.transaction((tx) => {
    parsed.data.orderedIds.forEach((id, i) => {
      tx.update(sections).set({ order: i, updatedAt: new Date() }).where(eq(sections.id, id)).run();
    });
  });

  if (input.pageSlug) revalidatePageSchema(input.pageSlug);
}

const FieldTypeSchema = z.enum(FIELD_TYPES as [FieldType, ...FieldType[]]);

const FieldCreateSchema = z.object({
  sectionId: z.string().min(1),
  type: FieldTypeSchema,
  label: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).refine(isValidSlug),
});

export async function createFieldAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const pageSlug = (formData.get('pageSlug') as string | null) ?? '';

  const parsed = FieldCreateSchema.safeParse({
    sectionId: formData.get('sectionId'),
    type: formData.get('type'),
    label: ((formData.get('label') as string | null) ?? '').trim(),
    slug: slugify(((formData.get('slug') as string | null) ?? '').trim()),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  const dup = await db
    .select({ id: fields.id })
    .from(fields)
    .where(and(eq(fields.sectionId, parsed.data.sectionId), eq(fields.slug, parsed.data.slug)))
    .get();
  if (dup) throw new Error(`Field key "${parsed.data.slug}" is already used in this section`);

  const maxOrder = await db
    .select({ max: max(fields.order) })
    .from(fields)
    .where(eq(fields.sectionId, parsed.data.sectionId))
    .get();
  const nextOrder = (maxOrder?.max ?? -1) + 1;

  const def = getFieldDefinition(parsed.data.type);
  if (!def) throw new Error('Unknown field type');

  await db.insert(fields).values({
    id: createId(),
    sectionId: parsed.data.sectionId,
    slug: parsed.data.slug,
    label: parsed.data.label,
    type: parsed.data.type,
    order: nextOrder,
    config: def.defaultConfig,
  });

  if (pageSlug) revalidatePageSchema(pageSlug);
}

const FieldUpdateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).refine(isValidSlug),
  config: z.record(z.unknown()),
});

export async function updateFieldAction(input: {
  id: string;
  label: string;
  slug: string;
  config: Record<string, unknown>;
  pageSlug: string;
}): Promise<void> {
  await requireAdmin();

  const parsed = FieldUpdateSchema.safeParse({
    id: input.id,
    label: input.label.trim(),
    slug: slugify(input.slug.trim()),
    config: input.config,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  const current = await db.select().from(fields).where(eq(fields.id, parsed.data.id)).get();
  if (!current) throw new Error('Field not found');

  const def = getFieldDefinition(current.type);
  if (!def) throw new Error('Unknown field type');

  const configResult = def.configSchema.safeParse(parsed.data.config);
  if (!configResult.success) {
    throw new Error(configResult.error.issues[0]?.message ?? 'Invalid config');
  }

  const dup = await db
    .select({ id: fields.id })
    .from(fields)
    .where(and(eq(fields.sectionId, current.sectionId), eq(fields.slug, parsed.data.slug)))
    .get();
  if (dup && dup.id !== parsed.data.id) {
    throw new Error(`Field key "${parsed.data.slug}" is already used in this section`);
  }

  await db
    .update(fields)
    .set({
      label: parsed.data.label,
      slug: parsed.data.slug,
      config: configResult.data as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(fields.id, parsed.data.id));

  if (input.pageSlug) revalidatePageSchema(input.pageSlug);
}

export async function deleteFieldAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id') as string | null;
  const pageSlug = (formData.get('pageSlug') as string | null) ?? '';
  if (!id) throw new Error('Missing id');

  await db.delete(fields).where(eq(fields.id, id));
  if (pageSlug) revalidatePageSchema(pageSlug);
}

export async function reorderFieldsAction(input: { sectionId: string; orderedIds: string[]; pageSlug: string }): Promise<void> {
  await requireAdmin();
  const parsed = z
    .object({ sectionId: z.string().min(1), orderedIds: z.array(z.string().min(1)) })
    .safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  await db.transaction((tx) => {
    parsed.data.orderedIds.forEach((id, i) => {
      tx.update(fields).set({ order: i, updatedAt: new Date() }).where(eq(fields.id, id)).run();
    });
  });

  if (input.pageSlug) revalidatePageSchema(input.pageSlug);
}

export type SectionWithFields = {
  id: string;
  slug: string;
  title: string;
  order: number;
  fields: {
    id: string;
    slug: string;
    label: string;
    type: string;
    order: number;
    config: Record<string, unknown>;
  }[];
};

export async function loadPageSchema(pageSlug: string) {
  const page = await findPageBySlugOrThrow(pageSlug);

  const allSections = await db
    .select()
    .from(sections)
    .where(eq(sections.pageId, page.id))
    .orderBy(sections.order)
    .all();

  const sectionIds = allSections.map((s) => s.id);

  const allFields = sectionIds.length
    ? await db.select().from(fields).orderBy(fields.order).all()
    : [];

  const fieldsBySection = new Map<string, SectionWithFields['fields']>();
  for (const f of allFields) {
    if (!sectionIds.includes(f.sectionId)) continue;
    const arr = fieldsBySection.get(f.sectionId) ?? [];
    arr.push({
      id: f.id,
      slug: f.slug,
      label: f.label,
      type: f.type,
      order: f.order,
      config: (f.config as Record<string, unknown>) ?? {},
    });
    fieldsBySection.set(f.sectionId, arr);
  }

  return {
    page,
    sections: allSections.map<SectionWithFields>((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      order: s.order,
      fields: fieldsBySection.get(s.id) ?? [],
    })),
  };
}
