'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { File as FileIcon, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadDropzone, type UploadedItem } from '@/components/media/upload-dropzone';
import { UploadDetailDialog } from './upload-detail-dialog';

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

export function MediaGrid({ initialUploads }: { initialUploads: Upload[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Upload | null>(null);
  const [open, setOpen] = useState(false);

  function handleUploaded(_uploaded: UploadedItem) {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <UploadDropzone onUploaded={handleUploaded} />

      {initialUploads.length === 0 ? (
        <div className="rounded-md border bg-card p-12 text-center">
          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No uploads yet. Drop a file above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {initialUploads.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                setSelected(u);
                setOpen(true);
              }}
              className={cn(
                'group relative aspect-square rounded-md border overflow-hidden bg-muted/30',
                'hover:border-primary/50 hover:ring-2 hover:ring-primary/20 transition-all'
              )}
            >
              {u.mime.startsWith('image/') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/uploads/${u.filename}`}
                  alt={u.alt || u.originalName}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <FileIcon className="h-8 w-8" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                <p className="text-white text-xs font-medium truncate">{u.originalName}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <UploadDetailDialog upload={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
