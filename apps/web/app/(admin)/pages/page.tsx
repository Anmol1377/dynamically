import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { listPages } from './actions';
import { NewPageDialog } from './new-page-form';
import { PageRowActions } from './page-row-actions';

export const dynamic = 'force-dynamic';

export default async function PagesIndex() {
  const allPages = await listPages();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pages</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Define a page, build its sections, then fill in content.
          </p>
        </div>
        <NewPageDialog />
      </div>

      {allPages.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-medium">No pages yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first page to start modeling content.
          </p>
        </Card>
      ) : (
        <Card className="divide-y">
          {allPages.map((p) => (
            <Link
              key={p.id}
              href={`/pages/${p.slug}/edit`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-accent/40 transition-colors group"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{p.title}</span>
                  {p.status === 'published' ? (
                    <Badge variant="success">published</Badge>
                  ) : (
                    <Badge variant="muted">draft</Badge>
                  )}
                </div>
                <code className="text-xs text-muted-foreground">/{p.slug}</code>
              </div>
              <PageRowActions id={p.id} title={p.title} slug={p.slug} />
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
