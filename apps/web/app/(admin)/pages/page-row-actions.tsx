'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { deletePageAction, renamePageAction } from './actions';
import { slugify } from '@/lib/slug';

type Props = { id: string; title: string; slug: string };

export function PageRowActions({ id, title, slug }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [newSlug, setNewSlug] = useState(slug);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function rename() {
    setError(null);
    const fd = new FormData();
    fd.set('id', id);
    fd.set('title', newTitle);
    fd.set('slug', slugify(newSlug));
    startTransition(async () => {
      try {
        await renamePageAction(fd);
        setRenameOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Rename failed');
      }
    });
  }

  function remove() {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(async () => {
      await deletePageAction(fd);
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setMenuOpen((o) => !o);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-1 w-40 z-50 rounded-md border bg-popover shadow-md text-sm">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setRenameOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename page</DialogTitle>
            <DialogDescription>
              Changing the slug breaks the public API URL{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/v1/pages/{slug}</code>. Update
              your frontend before publishing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`title-${id}`}>Title</Label>
              <Input
                id={`title-${id}`}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`slug-${id}`}>Slug</Label>
              <Input
                id={`slug-${id}`}
                value={newSlug}
                onChange={(e) => setNewSlug(slugify(e.target.value))}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={rename} disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete page?</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-semibold">{title}</span> and all of its
              sections, fields, and content. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? 'Deleting…' : 'Delete page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
