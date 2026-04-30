'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createApiKeyAction } from './actions';

export function CreateKeyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'read' | 'preview'>('read');
  const [created, setCreated] = useState<{ plain: string } | null>(null);
  const [reveal, setReveal] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setName('');
    setScope('read');
    setCreated(null);
    setReveal(true);
    setError(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createApiKeyAction({ name, scope });
        setCreated({ plain: result.plain });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not create key');
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create API key
        </Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>API key created</DialogTitle>
              <DialogDescription>
                Copy this now — for security, you won't see the full key again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
                <code className="flex-1 text-xs break-all">
                  {reveal ? created.plain : '•'.repeat(created.plain.length)}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setReveal((r) => !r)}
                >
                  {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(created.plain)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use as <code>Authorization: Bearer &lt;key&gt;</code>
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create an API key</DialogTitle>
              <DialogDescription>
                Used by your frontend to fetch content from{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/v1/...</code>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production frontend"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-scope">Scope</Label>
                <Select
                  id="key-scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'read' | 'preview')}
                >
                  <option value="read">read — published content only</option>
                  <option value="preview">preview — also reads draft content</option>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={pending || !name}>
                {pending ? 'Creating…' : 'Create key'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
