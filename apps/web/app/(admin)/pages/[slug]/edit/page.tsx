import { notFound } from 'next/navigation';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { uploads } from '@/lib/db/schema';
import { loadPageContent } from '@/lib/content/loader';
import { ContentEditor } from './content-editor';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: { slug: string } }) {
  const data = await loadPageContent(params.slug);
  if (!data) notFound();

  const allUploads = await db.select().from(uploads).orderBy(desc(uploads.createdAt)).all();

  return (
    <ContentEditor
      page={{
        id: data.page.id,
        slug: data.page.slug,
        title: data.page.title,
        status: data.page.status,
      }}
      sections={data.sections.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        fields: s.fields.map((f) => ({
          id: f.id,
          slug: f.slug,
          label: f.label,
          type: f.type,
          config: f.config,
          draftValue: f.draftValue,
          publishedValue: f.publishedValue,
          hasDraft: f.hasDraft,
        })),
      }))}
      initialUnpublishedChanges={data.hasUnpublishedChanges}
      uploads={allUploads.map((u) => ({
        id: u.id,
        filename: u.filename,
        originalName: u.originalName,
        mime: u.mime,
        width: u.width,
        height: u.height,
        alt: u.alt,
      }))}
    />
  );
}
