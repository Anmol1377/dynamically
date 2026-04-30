'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { slugify } from '@/lib/slug';
import { createPageAction, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create page'}
    </Button>
  );
}

export function NewPageDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createPageAction, initial);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New page
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new page</DialogTitle>
          <DialogDescription>
            Pick a human-friendly title and a URL slug. The slug becomes the API route — e.g.{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/v1/pages/home</code>.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Home"
              autoFocus
            />
            {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              placeholder="home"
            />
            {state.errors?.slug && <p className="text-sm text-destructive">{state.errors.slug[0]}</p>}
          </div>

          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
