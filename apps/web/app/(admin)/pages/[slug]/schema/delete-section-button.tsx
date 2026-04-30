'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteSectionAction } from './actions';

export function DeleteSectionButton({
  id,
  title,
  fieldCount,
  pageSlug,
}: {
  id: string;
  title: string;
  fieldCount: number;
  pageSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    const fd = new FormData();
    fd.set('id', id);
    fd.set('pageSlug', pageSlug);
    startTransition(async () => {
      await deleteSectionAction(fd);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete section?</DialogTitle>
          <DialogDescription>
            This permanently deletes <span className="font-semibold">{title}</span>
            {fieldCount > 0
              ? ` and its ${fieldCount} field${fieldCount === 1 ? '' : 's'}`
              : ''}
            . This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={remove} disabled={pending}>
            {pending ? 'Deleting…' : 'Delete section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
