'use client';

import { useState } from 'react';
import { ImageOff, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImagePickerDialog, type PickerUpload } from '@/components/media/image-picker-dialog';

export function ImageField({
  fieldId,
  label,
  required,
  helpText,
  value,
  onChange,
  uploads,
}: {
  fieldId: string;
  label: string;
  required: boolean;
  helpText?: string;
  value: unknown;
  onChange: (v: unknown) => void;
  uploads: PickerUpload[];
}) {
  const [open, setOpen] = useState(false);
  const uploadId = typeof value === 'string' && value ? value : null;
  const current = uploadId ? uploads.find((u) => u.id === uploadId) : null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${fieldId}`} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      {current ? (
        <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/uploads/${current.filename}`}
            alt={current.alt || current.originalName}
            className="h-24 w-24 object-cover rounded-md border bg-background"
          />
          <div className="flex-1 min-w-0 text-xs space-y-1">
            <div className="font-medium text-sm truncate">{current.originalName}</div>
            <div className="text-muted-foreground">
              {current.mime}
              {current.width && current.height ? ` · ${current.width}×${current.height}` : ''}
            </div>
            {current.alt && <div className="text-muted-foreground italic truncate">"{current.alt}"</div>}
            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full justify-center"
        >
          {uploads.length === 0 ? (
            <>
              <ImageOff className="h-4 w-4" />
              Choose image (none uploaded yet)
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              Choose image
            </>
          )}
        </Button>
      )}

      {helpText && <p className="text-xs text-muted-foreground mt-1">{helpText}</p>}

      <ImagePickerDialog
        open={open}
        onOpenChange={setOpen}
        uploads={uploads}
        selectedId={uploadId}
        onSelect={(id) => onChange(id || null)}
      />
    </div>
  );
}
