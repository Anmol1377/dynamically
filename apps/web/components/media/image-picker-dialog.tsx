'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { File as FileIcon, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { UploadDropzone, type UploadedItem } from './upload-dropzone';

export type PickerUpload = {
  id: string;
  filename: string;
  originalName: string;
  mime: string;
  width: number | null;
  height: number | null;
  alt: string;
};

export function ImagePickerDialog({
  open,
  onOpenChange,
  uploads,
  onSelect,
  selectedId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  uploads: PickerUpload[];
  onSelect: (uploadId: string) => void;
  selectedId?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pendingPick, setPendingPick] = useState<string | null>(selectedId ?? null);

  function handleUploaded(uploaded: UploadedItem) {
    if (uploaded.mime.startsWith('image/')) setPendingPick(uploaded.id);
    setPending(true);
    router.refresh();
    setTimeout(() => setPending(false), 300);
  }

  function confirm() {
    if (pendingPick) {
      onSelect(pendingPick);
      onOpenChange(false);
    }
  }

  const images = uploads.filter((u) => u.mime.startsWith('image/'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
          <DialogDescription>
            Pick an existing image or upload a new one. Files appear in the Media library.
          </DialogDescription>
        </DialogHeader>

        <UploadDropzone onUploaded={handleUploaded} />

        <div className="max-h-[50vh] overflow-y-auto border rounded-md p-3 bg-muted/20">
          {images.length === 0 && !pending ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
              No images uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {images.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setPendingPick(u.id)}
                  className={cn(
                    'group relative aspect-square rounded-md overflow-hidden border-2 transition-colors',
                    pendingPick === u.id
                      ? 'border-primary'
                      : 'border-transparent hover:border-primary/40'
                  )}
                  title={u.originalName}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/uploads/${u.filename}`}
                    alt={u.alt || u.originalName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {pendingPick === u.id && (
                    <div className="absolute inset-0 bg-primary/10 ring-2 ring-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="!justify-between">
          {pendingPick && pendingPick !== selectedId && (
            <Button variant="ghost" size="sm" onClick={() => onSelect('')}>
              <FileIcon className="h-3.5 w-3.5" />
              Clear selection
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={!pendingPick}>
              Use this image
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
