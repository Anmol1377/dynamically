'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UploadedItem = {
  id: string;
  filename: string;
  originalName: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  url: string;
};

export function UploadDropzone({
  onUploaded,
  className,
}: {
  onUploaded: (uploaded: UploadedItem) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const list = Array.from(files);
      if (list.length === 0) return;
      setUploading(true);
      try {
        for (const file of list) {
          const fd = new FormData();
          fd.set('file', file);
          const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error?.message ?? `Upload failed (${res.status})`);
          }
          const uploaded = (await res.json()) as UploadedItem;
          onUploaded(uploaded);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  return (
    <div className={cn('space-y-2', className)}>
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          setActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={() => setActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setActive(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer px-4 py-8 text-sm transition-colors',
          active ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent/30'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.currentTarget.value = '';
          }}
        />
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Uploading…</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Drop files or <span className="text-foreground underline">click to browse</span>
            </span>
          </>
        )}
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
