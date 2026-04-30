'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/slug';
import { FIELD_REGISTRY, FIELD_TYPES, type FieldType } from '@/lib/fields/registry';
import { createFieldAction } from './actions';

export function AddFieldDialog({ sectionId, pageSlug }: { sectionId: string; pageSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [type, setType] = useState<FieldType | null>(null);
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(label));
  }, [label, slugTouched]);

  function reset() {
    setStep('type');
    setType(null);
    setLabel('');
    setSlug('');
    setSlugTouched(false);
    setError(null);
  }

  function pickType(t: FieldType) {
    setType(t);
    setStep('details');
  }

  function submit() {
    if (!type) return;
    setError(null);
    const fd = new FormData();
    fd.set('sectionId', sectionId);
    fd.set('pageSlug', pageSlug);
    fd.set('type', type);
    fd.set('label', label);
    fd.set('slug', slug);
    startTransition(async () => {
      try {
        await createFieldAction(fd);
        setOpen(false);
        reset();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not add field');
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add field
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        {step === 'type' ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose a field type</DialogTitle>
              <DialogDescription>
                Pick the kind of content this field will hold. You can change everything else later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FIELD_TYPES.map((t) => {
                const def = FIELD_REGISTRY[t];
                const Icon = def.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickType(t)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors',
                      'hover:bg-accent hover:border-primary/40'
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="font-medium text-sm">{def.label}</div>
                    <div className="text-xs text-muted-foreground">{def.description}</div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Configure {type && FIELD_REGISTRY[type].label.toLowerCase()} field
              </DialogTitle>
              <DialogDescription>
                The label is what editors see. The key is the JSON property your frontend reads.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Headline"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-slug">Key</Label>
                <Input
                  id="field-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setSlugTouched(true);
                  }}
                  placeholder="headline"
                />
                <p className="text-xs text-muted-foreground">
                  API output: <code className="bg-muted px-1 py-0.5 rounded">sections.[section].{slug || 'key'}</code>
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('type')}>
                Back
              </Button>
              <Button onClick={submit} disabled={pending || !label || !slug}>
                {pending ? 'Adding…' : 'Add field'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
