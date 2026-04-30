'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
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
import { deleteUploadAction, updateUploadAltAction } from './actions';

type Upload = {
  id: string;
  filename: string;
  originalName: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
};

export function UploadDetailDialog({
  upload,
  open,
  onOpenChange,
}: {
  upload: Upload | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [alt, setAlt] = useState(upload?.alt ?? '');
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!upload) return null;

  function saveAlt() {
    startTransition(async () => {
      await updateUploadAltAction({ id: upload!.id, alt });
      router.refresh();
    });
  }

  function remove() {
    const fd = new FormData();
    fd.set('id', upload!.id);
    startTransition(async () => {
      await deleteUploadAction(fd);
      onOpenChange(false);
      router.refresh();
    });
  }

  const isImage = upload.mime.startsWith('image/');

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setAlt(upload?.alt ?? '');
          setConfirmDelete(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{upload.originalName}</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {upload.mime} · {(upload.size / 1024).toFixed(1)} KB
            {upload.width && upload.height ? ` · ${upload.width}×${upload.height}` : ''}
          </DialogDescription>
        </DialogHeader>

        {isImage && (
          <div className="rounded-md border bg-muted/40 p-3 flex items-center justify-center max-h-72 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/uploads/${upload.filename}`}
              alt={upload.alt || upload.originalName}
              className="max-h-64 w-auto object-contain"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="alt">Alt text</Label>
          <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Describes the image for screen readers. Returned as the <code>alt</code> field in the
            public API.
          </p>
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
          <div>
            URL: <code className="break-all">/uploads/{upload.filename}</code>
          </div>
        </div>

        {confirmDelete ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm space-y-2">
            <p className="text-destructive font-medium">Delete this upload?</p>
            <p className="text-xs text-muted-foreground">
              Any image fields currently pointing at this upload will return <code>null</code> in
              the public API.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={remove} disabled={pending}>
                {pending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter className="!justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={saveAlt} disabled={pending || alt === upload.alt}>
                {pending ? 'Saving…' : 'Save alt text'}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
