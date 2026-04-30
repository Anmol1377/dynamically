'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSettingsAction } from './actions';

type Props = { siteName: string; publicReadEnabled: boolean };

export function GeneralForm({ siteName, publicReadEnabled }: Props) {
  const router = useRouter();
  const [name, setName] = useState(siteName);
  const [publicRead, setPublicRead] = useState(publicReadEnabled);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('siteName', name);
    if (publicRead) fd.set('publicReadEnabled', 'on');
    startTransition(async () => {
      await updateSettingsAction(fd);
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="siteName">Site name</Label>
        <Input id="siteName" value={name} onChange={(e) => setName(e.target.value)} />
        <p className="text-xs text-muted-foreground">
          Display name used inside the admin UI. Not exposed to the public API yet.
        </p>
      </div>

      <div className="space-y-2 rounded-md border p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={publicRead}
            onChange={(e) => setPublicRead(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium">Allow anonymous public reads</div>
            <p className="text-xs text-muted-foreground">
              When on, <code>GET /api/v1/pages/...</code> works without an API key. Convenient for
              local dev. Turn this off in production.
            </p>
          </div>
        </label>
        {publicRead && (
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Your published content is currently fetchable by anyone who can reach this server. If
            this instance is on the public internet, prefer API keys.
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          <Save className="h-3.5 w-3.5" />
          {pending ? 'Saving…' : 'Save settings'}
        </Button>
        {savedAt && !pending && (
          <span className="text-xs text-muted-foreground">Saved.</span>
        )}
      </div>
    </form>
  );
}
