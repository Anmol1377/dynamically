import 'server-only';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { pages, sections, fields, contentValues } from '@/lib/db/schema';
import type { Page } from '@/lib/db/schema';

export type ContentField = {
  id: string;
  slug: string;
  label: string;
  type: string;
  order: number;
  config: Record<string, unknown>;
  draftValue: unknown;
  publishedValue: unknown;
  hasDraft: boolean;
  hasPublished: boolean;
};

export type ContentSection = {
  id: string;
  slug: string;
  title: string;
  order: number;
  fields: ContentField[];
};

export type PageContent = {
  page: Page;
  sections: ContentSection[];
  hasUnpublishedChanges: boolean;
};

export async function loadPageContent(pageSlug: string): Promise<PageContent | null> {
  const page = await db.select().from(pages).where(eq(pages.slug, pageSlug)).get();
  if (!page) return null;

  const allSections = await db
    .select()
    .from(sections)
    .where(eq(sections.pageId, page.id))
    .orderBy(sections.order)
    .all();

  if (allSections.length === 0) {
    return { page, sections: [], hasUnpublishedChanges: false };
  }

  const sectionIds = allSections.map((s) => s.id);

  const allFields = await db
    .select()
    .from(fields)
    .where(inArray(fields.sectionId, sectionIds))
    .orderBy(fields.order)
    .all();

  const fieldIds = allFields.map((f) => f.id);

  const allValues = fieldIds.length
    ? await db
        .select()
        .from(contentValues)
        .where(inArray(contentValues.fieldId, fieldIds))
        .all()
    : [];

  const drafts = new Map<string, unknown>();
  const published = new Map<string, unknown>();
  for (const v of allValues) {
    if (v.version === 'draft') drafts.set(v.fieldId, v.value);
    else if (v.version === 'published') published.set(v.fieldId, v.value);
  }

  let hasUnpublished = false;
  const fieldsBySection = new Map<string, ContentField[]>();
  for (const f of allFields) {
    const draftValue = drafts.has(f.id) ? drafts.get(f.id) : undefined;
    const publishedValue = published.has(f.id) ? published.get(f.id) : undefined;
    const hasDraft = drafts.has(f.id);
    const hasPublished = published.has(f.id);

    if (hasDraft && JSON.stringify(draftValue) !== JSON.stringify(publishedValue ?? null)) {
      hasUnpublished = true;
    }
    if (!hasDraft && !hasPublished) {
      // unpublished only if at least one published/draft row exists for the page,
      // or always counts as draft-not-yet-published — we treat empty page as "no changes"
    }

    const arr = fieldsBySection.get(f.sectionId) ?? [];
    arr.push({
      id: f.id,
      slug: f.slug,
      label: f.label,
      type: f.type,
      order: f.order,
      config: (f.config as Record<string, unknown>) ?? {},
      draftValue,
      publishedValue,
      hasDraft,
      hasPublished,
    });
    fieldsBySection.set(f.sectionId, arr);
  }

  return {
    page,
    sections: allSections.map<ContentSection>((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      order: s.order,
      fields: fieldsBySection.get(s.id) ?? [],
    })),
    hasUnpublishedChanges: hasUnpublished,
  };
}

export async function getPageFieldIds(pageId: string): Promise<string[]> {
  const rows = await db
    .select({ id: fields.id })
    .from(fields)
    .innerJoin(sections, eq(fields.sectionId, sections.id))
    .where(eq(sections.pageId, pageId))
    .all();
  return rows.map((r) => r.id);
}

export async function fieldsExistOnPage(pageId: string, fieldIds: string[]): Promise<Set<string>> {
  if (fieldIds.length === 0) return new Set();
  const rows = await db
    .select({ id: fields.id })
    .from(fields)
    .innerJoin(sections, eq(fields.sectionId, sections.id))
    .where(and(eq(sections.pageId, pageId), inArray(fields.id, fieldIds)))
    .all();
  return new Set(rows.map((r) => r.id));
}
