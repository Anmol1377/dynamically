import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FilePen, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FIELD_REGISTRY, type FieldType } from '@/lib/fields/registry';
import { loadPageSchema } from './actions';
import { AddSectionDialog } from './add-section-dialog';
import { EditSectionDialog } from './edit-section-dialog';
import { DeleteSectionButton } from './delete-section-button';
import { AddFieldDialog } from './add-field-dialog';
import { EditFieldDialog } from './edit-field-dialog';
import { DeleteFieldButton } from './delete-field-button';

export const dynamic = 'force-dynamic';

export default async function PageSchemaPage({ params }: { params: { slug: string } }) {
  let data;
  try {
    data = await loadPageSchema(params.slug);
  } catch {
    notFound();
  }

  const { page, sections } = data;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <Link
            href="/pages"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            All pages
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{page.title}</h1>
            {page.status === 'published' ? (
              <Badge variant="success">published</Badge>
            ) : (
              <Badge variant="muted">draft</Badge>
            )}
          </div>
          <code className="text-xs text-muted-foreground">/api/v1/pages/{page.slug}</code>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/pages/${page.slug}/edit`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <FilePen className="h-3.5 w-3.5" />
            Edit content
          </Link>
          <AddSectionDialog pageId={page.id} pageSlug={page.slug} />
        </div>
      </div>

      {sections.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-medium">No sections yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sections group related fields. Add one to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between gap-2 px-5 py-3 border-b">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{s.title}</span>
                    <code className="text-xs text-muted-foreground">{s.slug}</code>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <EditSectionDialog id={s.id} title={s.title} slug={s.slug} pageSlug={page.slug} />
                  <DeleteSectionButton
                    id={s.id}
                    title={s.title}
                    fieldCount={s.fields.length}
                    pageSlug={page.slug}
                  />
                </div>
              </div>

              {s.fields.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                  No fields yet.
                </div>
              ) : (
                <ul className="divide-y">
                  {s.fields.map((f) => {
                    const def = FIELD_REGISTRY[f.type as FieldType];
                    const Icon = def?.icon;
                    return (
                      <li key={f.id} className="flex items-center gap-3 px-5 py-2.5 group">
                        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm truncate">{f.label}</span>
                            {f.config.required ? (
                              <span className="text-[10px] text-destructive uppercase tracking-wider">required</span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <code>{f.slug}</code>
                            <span>·</span>
                            <span>{def?.label ?? f.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <EditFieldDialog field={f} pageSlug={page.slug} />
                          <DeleteFieldButton id={f.id} label={f.label} pageSlug={page.slug} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="px-3 py-2 border-t bg-muted/20">
                <AddFieldDialog sectionId={s.id} pageSlug={page.slug} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
