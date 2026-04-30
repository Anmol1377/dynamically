'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ImageField } from './image-field';
import { TiptapEditor } from '@/components/editors/tiptap';
import type { PickerUpload } from '@/components/media/image-picker-dialog';

export type FieldRendererProps = {
  fieldId: string;
  type: string;
  label: string;
  required: boolean;
  helpText?: string;
  config: Record<string, unknown>;
  value: unknown;
  onChange: (next: unknown) => void;
  uploads: PickerUpload[];
};

export function FieldRenderer(props: FieldRendererProps) {
  const { type } = props;
  const inputId = `f-${props.fieldId}`;
  const help = props.helpText ? (
    <p className="text-xs text-muted-foreground mt-1">{props.helpText}</p>
  ) : null;
  const labelEl = (
    <Label htmlFor={inputId} className="flex items-center gap-1">
      {props.label}
      {props.required && <span className="text-destructive">*</span>}
    </Label>
  );

  switch (type) {
    case 'text': {
      const maxLength = props.config.maxLength as number | undefined;
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            id={inputId}
            value={(props.value as string) ?? ''}
            onChange={(e) => props.onChange(e.target.value)}
            maxLength={maxLength}
            required={props.required}
          />
          {help}
        </div>
      );
    }

    case 'textarea': {
      const rows = (props.config.rows as number) ?? 4;
      const maxLength = props.config.maxLength as number | undefined;
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Textarea
            id={inputId}
            value={(props.value as string) ?? ''}
            onChange={(e) => props.onChange(e.target.value)}
            rows={rows}
            maxLength={maxLength}
            required={props.required}
          />
          {help}
        </div>
      );
    }

    case 'number': {
      const min = props.config.min as number | undefined;
      const max = props.config.max as number | undefined;
      const v = props.value as number | null | undefined;
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            id={inputId}
            type="number"
            value={v === null || v === undefined ? '' : v}
            onChange={(e) =>
              props.onChange(e.target.value === '' ? null : Number(e.target.value))
            }
            min={min}
            max={max}
            required={props.required}
          />
          {help}
        </div>
      );
    }

    case 'boolean': {
      return (
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={Boolean(props.value)}
              onChange={(e) => props.onChange(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            {props.label}
            {props.required && <span className="text-destructive">*</span>}
          </label>
          {help}
        </div>
      );
    }

    case 'url': {
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            id={inputId}
            type="url"
            value={(props.value as string) ?? ''}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder="https://…"
            required={props.required}
          />
          {help}
        </div>
      );
    }

    case 'email': {
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            id={inputId}
            type="email"
            value={(props.value as string) ?? ''}
            onChange={(e) => props.onChange(e.target.value)}
            required={props.required}
          />
          {help}
        </div>
      );
    }

    case 'select': {
      const options =
        (props.config.options as { value: string; label: string }[] | undefined) ?? [];
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Select
            id={inputId}
            value={(props.value as string) ?? ''}
            onChange={(e) => props.onChange(e.target.value || null)}
            required={props.required}
          >
            <option value="">— select —</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {help}
        </div>
      );
    }

    case 'image': {
      return (
        <ImageField
          fieldId={props.fieldId}
          label={props.label}
          required={props.required}
          helpText={props.helpText}
          value={props.value}
          onChange={props.onChange}
          uploads={props.uploads}
        />
      );
    }

    case 'richtext': {
      return (
        <div className="space-y-1.5">
          {labelEl}
          <TiptapEditor
            value={(props.value as string) ?? ''}
            onChange={(html) => props.onChange(html)}
          />
          {help}
        </div>
      );
    }

    case 'multiselect': {
      const options =
        (props.config.options as { value: string; label: string }[] | undefined) ?? [];
      const current = Array.isArray(props.value) ? (props.value as string[]) : [];
      function toggle(v: string) {
        const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
        props.onChange(next);
      }
      return (
        <div className="space-y-1.5">
          {labelEl}
          <div className="flex flex-wrap gap-1.5">
            {options.length === 0 ? (
              <p className="text-xs text-muted-foreground">No options configured.</p>
            ) : (
              options.map((o) => {
                const active = current.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={
                      'rounded-md border px-2.5 py-1 text-xs transition-colors ' +
                      (active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent text-foreground')
                    }
                  >
                    {o.label}
                  </button>
                );
              })
            )}
          </div>
          {help}
        </div>
      );
    }

    case 'color': {
      const v = (props.value as string) ?? '';
      return (
        <div className="space-y-1.5">
          {labelEl}
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              type="color"
              value={v || '#000000'}
              onChange={(e) => props.onChange(e.target.value)}
              className="h-9 w-12 rounded-md border bg-transparent p-1 cursor-pointer"
            />
            <Input
              value={v}
              onChange={(e) => props.onChange(e.target.value || null)}
              placeholder="#000000"
              className="flex-1 font-mono text-xs"
            />
          </div>
          {help}
        </div>
      );
    }

    case 'date': {
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            id={inputId}
            type="date"
            value={(props.value as string) ?? ''}
            onChange={(e) => props.onChange(e.target.value || null)}
            required={props.required}
          />
          {help}
        </div>
      );
    }

    default:
      return (
        <div className="space-y-1.5">
          {labelEl}
          <p className="text-xs text-muted-foreground">
            Unknown field type <code>{type}</code>
          </p>
        </div>
      );
  }
}
