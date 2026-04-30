import { eq, desc } from 'drizzle-orm';
import { Key } from 'lucide-react';
import { db } from '@/lib/db/client';
import { settings, apiKeys } from '@/lib/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GeneralForm } from './general-form';
import { CreateKeyDialog } from './create-key-dialog';
import { RevokeKeyButton } from './revoke-key-button';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const s =
    (await db.select().from(settings).where(eq(settings.id, 1)).get()) ?? {
      siteName: 'My Site',
      publicReadEnabled: false,
    };

  const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt)).all();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Instance-wide configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <GeneralForm siteName={s.siteName} publicReadEnabled={s.publicReadEnabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>API keys</CardTitle>
            <CardDescription>
              Tokens your frontend uses to fetch content. Keys are hashed at rest — the plaintext is
              shown only once.
            </CardDescription>
          </div>
          <CreateKeyDialog />
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-10">
              <Key className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No API keys yet.</p>
            </div>
          ) : (
            <ul className="divide-y border rounded-md">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                  <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{k.name}</span>
                      <Badge variant={k.scope === 'preview' ? 'default' : 'secondary'}>
                        {k.scope}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code>{k.keyPrefix}…</code>
                      <span>·</span>
                      <span>
                        Last used:{' '}
                        {k.lastUsedAt
                          ? new Date(k.lastUsedAt).toLocaleString()
                          : 'never'}
                      </span>
                    </div>
                  </div>
                  <RevokeKeyButton id={k.id} name={k.name} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
