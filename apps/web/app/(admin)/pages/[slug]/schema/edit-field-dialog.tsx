'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { slugify } from '@/lib/slug';
import { FIELD_REGISTRY, type FieldType } from '@/lib/fields/registry';
import { updateFieldAction } from './actions';

type FieldData = {
  id: string;
  label: string;
  slug: string;
  type: string;
  config: Record<string, unknown>;
};

export function EditFieldDialog({ field, pageSlug }: { field: FieldData; pageSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(field.label);
  const [slug, setSlug] = useState(field.slug);
  const [config, setConfig] = useState<Record<string, unknown>>(field.config);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setVal<T>(key: string, v: T | undefined) {
    setConfig((c) => {
      const next = { ...c };
      if (v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v))) {
        delete next[key];
      } else {
        next[key] = v;
      }
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateFieldAction({ id: field.id, label, slug, config, pageSlug });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save field');
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setLabel(field.label);
          setSlug(field.slug);
          setConfig(field.config);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit field</DialogTitle>
          <DialogDescription>
            Type: <span className="font-medium">{FIELD_REGISTRY[field.type as FieldType]?.label ?? field.type}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ef-label">Label</Label>
              <Input id="ef-label" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ef-slug">Key</Label>
              <Input
                id="ef-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </div>
          </div>

          <CommonConfig config={config} setVal={setVal} />

          <TypeSpecificConfig type={field.type as FieldType} config={config} setVal={setVal} setConfig={setConfig} />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !label || !slug}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommonConfig({
  config,
  setVal,
}: {
  config: Record<string, unknown>;
  setVal: <T>(k: string, v: T | undefined) => void;
}) {
  return (
    <div className="space-y-3 border-t pt-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(config.required)}
          onChange={(e) => setVal('required', e.target.checked || undefined)}
          className="h-4 w-4 rounded border-input"
        />
        Required field
      </label>
      <div className="space-y-2">
        <Label htmlFor="ef-help">Help text (optional)</Label>
        <Input
          id="ef-help"
          value={(config.helpText as string) ?? ''}
          onChange={(e) => setVal('helpText', e.target.value || undefined)}
          placeholder="Shown under the field in the editor"
        />
      </div>
    </div>
  );
}

function TypeSpecificConfig({
  type,
  config,
  setVal,
  setConfig,
}: {
  type: FieldType;
  config: Record<string, unknown>;
  setVal: <T>(k: string, v: T | undefined) => void;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  if (type === 'text' || type === 'url' || type === 'email') {
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="ef-default">Default value</Label>
          <Input
            id="ef-default"
            value={(config.defaultValue as string) ?? ''}
            onChange={(e) => setVal('defaultValue', e.target.value || undefined)}
          />
        </div>
        {type === 'text' && (
          <div className="space-y-2">
            <Label htmlFor="ef-maxlen">Max length (optional)</Label>
            <Input
              id="ef-maxlen"
              type="number"
              value={(config.maxLength as number | undefined) ?? ''}
              onChange={(e) =>
                setVal('maxLength', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </div>
        )}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="ef-default">Default value</Label>
          <Textarea
            id="ef-default"
            value={(config.defaultValue as string) ?? ''}
            onChange={(e) => setVal('defaultValue', e.target.value || undefined)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ef-rows">Rows</Label>
            <Input
              id="ef-rows"
              type="number"
              min={1}
              value={(config.rows as number) ?? 4}
              onChange={(e) => setVal('rows', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ef-maxlen">Max length</Label>
            <Input
              id="ef-maxlen"
              type="number"
              value={(config.maxLength as number | undefined) ?? ''}
              onChange={(e) =>
                setVal('maxLength', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ef-default">Default</Label>
            <Input
              id="ef-default"
              type="number"
              value={(config.defaultValue as number | undefined) ?? ''}
              onChange={(e) =>
                setVal('defaultValue', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ef-min">Min</Label>
            <Input
              id="ef-min"
              type="number"
              value={(config.min as number | undefined) ?? ''}
              onChange={(e) =>
                setVal('min', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ef-max">Max</Label>
            <Input
              id="ef-max"
              type="number"
              value={(config.max as number | undefined) ?? ''}
              onChange={(e) =>
                setVal('max', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'boolean') {
    return (
      <div className="space-y-3 border-t pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(config.defaultValue)}
            onChange={(e) => setVal('defaultValue', e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Default value (checked = true)
        </label>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="ef-aspect">Aspect ratio hint (informational)</Label>
          <Input
            id="ef-aspect"
            value={(config.aspectRatioHint as string) ?? ''}
            onChange={(e) => setVal('aspectRatioHint', e.target.value || undefined)}
            placeholder="e.g. 16:9"
          />
        </div>
      </div>
    );
  }

  if (type === 'color') {
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="ef-default">Default color</Label>
          <Input
            id="ef-default"
            value={(config.defaultValue as string) ?? ''}
            onChange={(e) => setVal('defaultValue', e.target.value || undefined)}
            placeholder="#0066ff"
            className="font-mono text-xs"
          />
        </div>
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="ef-default">Default date</Label>
          <Input
            id="ef-default"
            type="date"
            value={(config.defaultValue as string) ?? ''}
            onChange={(e) => setVal('defaultValue', e.target.value || undefined)}
          />
        </div>
      </div>
    );
  }

  if (type === 'richtext') {
    return null;
  }

  if (type === 'select' || type === 'multiselect') {
    const options = ((config.options as { value: string; label: string }[] | undefined) ?? []);
    function setOptions(next: { value: string; label: string }[]) {
      setConfig((c) => ({ ...c, options: next }));
    }
    return (
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label>Options</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOptions([...options, { value: '', label: '' }])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add option
          </Button>
        </div>
        {options.length === 0 && (
          <p className="text-xs text-muted-foreground">No options yet — add at least one.</p>
        )}
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="value"
                value={opt.value}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = { ...next[i]!, value: e.target.value };
                  setOptions(next);
                }}
                className="flex-1"
              />
              <Input
                placeholder="Label"
                value={opt.label}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = { ...next[i]!, label: e.target.value };
                  setOptions(next);
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {type === 'select' && (
          <div className="space-y-2">
            <Label htmlFor="ef-default-select">Default value (must match an option's value)</Label>
            <Input
              id="ef-default-select"
              value={(config.defaultValue as string) ?? ''}
              onChange={(e) => setVal('defaultValue', e.target.value || undefined)}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
