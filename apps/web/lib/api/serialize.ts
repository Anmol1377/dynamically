import 'server-only';
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { uploads } from '@/lib/db/schema';
import type { ContentSection, PageContent } from '@/lib/content/loader';

export type ApiPageSummary = {
  slug: string;
  title: string;
  updatedAt: string;
};

export type ApiPageContent = {
  slug: string;
  title: string;
  status: 'draft' | 'published';
  updatedAt: string;
  sections: Record<string, Record<string, unknown>>;
};

export function serializePageSummary(p: PageContent['page']): ApiPageSummary {
  return {
    slug: p.slug,
    title: p.title,
    updatedAt: p.updatedAt.toISOString(),
  };
}

type UploadInfo = {
  filename: string;
  width: number | null;
  height: number | null;
  alt: string;
};

function serializeFieldValue(
  type: string,
  config: Record<string, unknown>,
  value: unknown,
  uploadIndex: Map<string, UploadInfo>
): unknown {
  if (value === undefined) {
    if (type === 'image') return null;
    return config.defaultValue ?? null;
  }
  switch (type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'url':
    case 'email':
    case 'select':
    case 'color':
    case 'date':
      return typeof value === 'string' ? value : null;
    case 'number':
      return typeof value === 'number' ? value : null;
    case 'boolean':
      return typeof value === 'boolean' ? value : Boolean(config.defaultValue ?? false);
    case 'multiselect':
      return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
    case 'image':
      return serializeImageValue(value, uploadIndex);
    default:
      return value ?? null;
  }
}

function serializeImageValue(value: unknown, uploadIndex: Map<string, UploadInfo>): unknown {
  if (typeof value !== 'string' || !value) return null;
  const u = uploadIndex.get(value);
  if (!u) return null;
  return {
    url: `/uploads/${u.filename}`,
    width: u.width,
    height: u.height,
    alt: u.alt,
  };
}

function collectImageUploadIds(data: PageContent, version: 'draft' | 'published'): string[] {
  const ids: string[] = [];
  for (const s of data.sections) {
    for (const f of s.fields) {
      if (f.type !== 'image') continue;
      const raw =
        version === 'draft' ? (f.hasDraft ? f.draftValue : f.publishedValue) : f.publishedValue;
      if (typeof raw === 'string' && raw) ids.push(raw);
    }
  }
  return ids;
}

async function buildUploadIndex(ids: string[]): Promise<Map<string, UploadInfo>> {
  const map = new Map<string, UploadInfo>();
  if (ids.length === 0) return map;
  const rows = await db.select().from(uploads).where(inArray(uploads.id, ids)).all();
  for (const r of rows) {
    map.set(r.id, { filename: r.filename, width: r.width, height: r.height, alt: r.alt });
  }
  return map;
}

export async function serializePageContent(
  data: PageContent,
  version: 'draft' | 'published'
): Promise<ApiPageContent> {
  const ids = collectImageUploadIds(data, version);
  const uploadIndex = await buildUploadIndex(ids);

  const sectionsObj: Record<string, Record<string, unknown>> = {};
  for (const s of data.sections) {
    sectionsObj[s.slug] = serializeSection(s, version, uploadIndex);
  }
  return {
    slug: data.page.slug,
    title: data.page.title,
    status: data.page.status,
    updatedAt: data.page.updatedAt.toISOString(),
    sections: sectionsObj,
  };
}

function serializeSection(
  s: ContentSection,
  version: 'draft' | 'published',
  uploadIndex: Map<string, UploadInfo>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of s.fields) {
    const raw = version === 'draft' ? (f.hasDraft ? f.draftValue : f.publishedValue) : f.publishedValue;
    out[f.slug] = serializeFieldValue(f.type, f.config, raw, uploadIndex);
  }
  return out;
}
