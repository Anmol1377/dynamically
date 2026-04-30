'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { slugify } from '@/lib/slug';
import { createSectionAction } from './actions';

export function AddSectionDialog({ pageId, pageSlug }: { pageId: string; pageSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  function reset() {
    setTitle('');
    setSlug('');
    setSlugTouched(false);
    setError(null);
  }

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set('pageId', pageId);
    fd.set('pageSlug', pageSlug);
    fd.set('title', title);
    fd.set('slug', slug);
    startTransition(async () => {
      try {
        await createSectionAction(fd);
        setOpen(false);
        reset();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not add section');
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
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Add section
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a section</DialogTitle>
          <DialogDescription>
            Sections group related fields. The slug becomes a key in the API JSON — e.g. the{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">hero</code> section returns as{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{`sections.hero`}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hero"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-slug">Slug</Label>
            <Input
              id="section-slug"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              placeholder="hero"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !title || !slug}>
            {pending ? 'Adding…' : 'Add section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
