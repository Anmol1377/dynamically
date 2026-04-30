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
import { deleteApiKeyAction } from './actions';

export function RevokeKeyButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function revoke() {
    const fd = new FormData();
    fd.set('id', id);
    startTransition(async () => {
      await deleteApiKeyAction(fd);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Revoke
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke "{name}"?</DialogTitle>
          <DialogDescription>
            Apps using this key will stop receiving content immediately. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={revoke} disabled={pending}>
            {pending ? 'Revoking…' : 'Revoke key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
