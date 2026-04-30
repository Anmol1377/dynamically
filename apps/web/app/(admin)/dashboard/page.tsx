import Link from 'next/link';
import { Plus, FileText, Image as ImageIcon, Key, ArrowRight } from 'lucide-react';
import { count, eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { pages, uploads, apiKeys } from '@/lib/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

async function loadStats() {
  const [pagesTotal, pagesPublished, uploadsTotal, apiKeysTotal] = await Promise.all([
    db.select({ n: count() }).from(pages).get(),
    db.select({ n: count() }).from(pages).where(eq(pages.status, 'published')).get(),
    db.select({ n: count() }).from(uploads).get(),
    db.select({ n: count() }).from(apiKeys).get(),
  ]);

  const recentPages = await db
    .select({
      id: pages.id,
      slug: pages.slug,
      title: pages.title,
      status: pages.status,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .orderBy(desc(pages.updatedAt))
    .limit(5)
    .all();

  return {
    pagesTotal: pagesTotal?.n ?? 0,
    pagesPublished: pagesPublished?.n ?? 0,
    pagesDraft: (pagesTotal?.n ?? 0) - (pagesPublished?.n ?? 0),
    uploadsTotal: uploadsTotal?.n ?? 0,
    apiKeysTotal: apiKeysTotal?.n ?? 0,
    recentPages,
  };
}

export default async function DashboardPage() {
  const stats = await loadStats();
  const isEmpty = stats.pagesTotal === 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {isEmpty
            ? 'Welcome to Dynamically. Start by modeling your first page.'
            : `${stats.pagesPublished} published, ${stats.pagesDraft} draft.`}
        </p>
      </div>

      {isEmpty && (
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Pages → Sections → Fields. The schema you define here drives the public API your
              frontend consumes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/pages" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Create your first page
            </Link>
            <Link href="/settings" className={buttonVariants({ variant: 'outline' })}>
              Configure settings
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <StatCard
          href="/pages"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          title="Pages"
          value={stats.pagesTotal}
          subtitle={
            stats.pagesTotal === 0
              ? 'No pages yet'
              : `${stats.pagesPublished} published · ${stats.pagesDraft} draft`
          }
        />
        <StatCard
          href="/media"
          icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
          title="Media"
          value={stats.uploadsTotal}
          subtitle={stats.uploadsTotal === 0 ? 'No uploads yet' : 'View library'}
        />
        <StatCard
          href="/settings"
          icon={<Key className="h-4 w-4 text-muted-foreground" />}
          title="API keys"
          value={stats.apiKeysTotal}
          subtitle={
            stats.apiKeysTotal === 0
              ? 'Create one in Settings'
              : 'Manage in Settings'
          }
        />
      </div>

      {stats.recentPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently edited</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {stats.recentPages.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/pages/${p.slug}/edit`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors group"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{p.title}</span>
                        {p.status === 'published' ? (
                          <Badge variant="success">published</Badge>
                        ) : (
                          <Badge variant="muted">draft</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <code>/{p.slug}</code>
                        <span>·</span>
                        <span>updated {formatRelative(p.updatedAt)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  href,
  icon,
  title,
  value,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-card text-card-foreground shadow hover:border-primary/40 hover:shadow-md transition-all"
    >
      <div className="p-6 pb-4 flex items-center justify-between">
        <span className="text-base font-semibold leading-none tracking-tight">{title}</span>
        {icon}
      </div>
      <div className="px-6 pb-6">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
      </div>
    </Link>
  );
}

function formatRelative(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
