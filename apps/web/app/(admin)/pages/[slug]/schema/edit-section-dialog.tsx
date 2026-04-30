'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { slugify } from '@/lib/slug';
import { updateSectionAction } from './actions';

type Props = { id: string; title: string; slug: string; pageSlug: string };

export function EditSectionDialog({ id, title, slug, pageSlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [t, setT] = useState(title);
  const [s, setS] = useState(slug);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set('id', id);
    fd.set('pageSlug', pageSlug);
    fd.set('title', t);
    fd.set('slug', s);
    startTransition(async () => {
      try {
        await updateSectionAction(fd);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit section</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`s-title-${id}`}>Title</Label>
            <Input id={`s-title-${id}`} value={t} onChange={(e) => setT(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`s-slug-${id}`}>Slug</Label>
            <Input
              id={`s-slug-${id}`}
              value={s}
              onChange={(e) => setS(slugify(e.target.value))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !t || !s}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
