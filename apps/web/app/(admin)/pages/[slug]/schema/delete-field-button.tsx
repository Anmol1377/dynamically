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
import { deleteFieldAction } from './actions';

export function DeleteFieldButton({
  id,
  label,
  pageSlug,
}: {
  id: string;
  label: string;
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
      await deleteFieldAction(fd);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete field?</DialogTitle>
          <DialogDescription>
            Permanently delete <span className="font-semibold">{label}</span> and any content stored
            in it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={remove} disabled={pending}>
            {pending ? 'Deleting…' : 'Delete field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
