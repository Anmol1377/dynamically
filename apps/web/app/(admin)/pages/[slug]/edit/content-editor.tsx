'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FieldRenderer } from './field-renderers';
import { PublishBar, type SaveStatus } from './publish-bar';
import { saveDraftAction } from './actions';
import type { PickerUpload } from '@/components/media/image-picker-dialog';

type Field = {
  id: string;
  slug: string;
  label: string;
  type: string;
  config: Record<string, unknown>;
  draftValue: unknown;
  publishedValue: unknown;
  hasDraft: boolean;
};

type Section = { id: string; slug: string; title: string; fields: Field[] };

type Props = {
  page: { id: string; slug: string; title: string; status: 'draft' | 'published' };
  sections: Section[];
  initialUnpublishedChanges: boolean;
  uploads: PickerUpload[];
};

const AUTOSAVE_DELAY_MS = 1000;

function valueFor(f: Field): unknown {
  if (f.hasDraft) return f.draftValue ?? null;
  if (f.publishedValue !== undefined) return f.publishedValue;
  const cfg = f.config;
  if (cfg.defaultValue !== undefined) return cfg.defaultValue;
  return null;
}

function computeDirty(
  current: Record<string, unknown>,
  baseline: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const id in current) {
    if (JSON.stringify(current[id]) !== JSON.stringify(baseline[id])) {
      out[id] = current[id];
    }
  }
  return out;
}

export function ContentEditor({ page, sections, initialUnpublishedChanges, uploads }: Props) {
  const router = useRouter();

  const initialValues = useMemo(() => {
    const v: Record<string, unknown> = {};
    for (const s of sections) for (const f of s.fields) v[f.id] = valueFor(f);
    return v;
  }, [sections]);

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(initialUnpublishedChanges);

  const baselineRef = useRef<Record<string, unknown>>(initialValues);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<unknown> | null>(null);
  const [, startTransition] = useTransition();

  function setField(id: string, next: unknown) {
    setValues((v) => ({ ...v, [id]: next }));
  }

  useEffect(() => {
    const dirty = computeDirty(values, baselineRef.current);
    if (Object.keys(dirty).length === 0) return;

    setStatus('dirty');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (inFlightRef.current) await inFlightRef.current.catch(() => {});

      const toSave = computeDirty(values, baselineRef.current);
      if (Object.keys(toSave).length === 0) return;

      setStatus('saving');
      const promise = saveDraftAction({ pageId: page.id, values: toSave });
      inFlightRef.current = promise;
      try {
        const result = await promise;
        if (!result.ok) {
          setStatus('error');
          return;
        }
        baselineRef.current = { ...baselineRef.current, ...toSave };
        setSavedAt(result.savedAt);
        setStatus('saved');
        setHasUnpublishedChanges(true);
      } catch {
        setStatus('error');
      } finally {
        inFlightRef.current = null;
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, page.id]);

  function onAfterPublish() {
    setHasUnpublishedChanges(false);
    startTransition(() => router.refresh());
  }

  function onAfterDiscard() {
    setValues(initialValues);
    baselineRef.current = initialValues;
    setHasUnpublishedChanges(false);
    setStatus('idle');
    setSavedAt(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          href="/pages"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          All pages
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{page.title}</h1>
          <Link
            href={`/pages/${page.slug}/schema`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Layers className="h-3.5 w-3.5" />
            Edit schema
          </Link>
        </div>
        <code className="text-xs text-muted-foreground">/api/v1/pages/{page.slug}</code>
      </div>

      <PublishBar
        page={page}
        status={status}
        savedAt={savedAt}
        hasUnpublishedChanges={hasUnpublishedChanges}
        onAfterPublish={onAfterPublish}
        onAfterDiscard={onAfterDiscard}
      />

      {sections.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-medium">No fields to edit yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add sections and fields in the schema editor first.
          </p>
          <Link
            href={`/pages/${page.slug}/schema`}
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Edit schema →
          </Link>
        </Card>
      ) : (
        <div className="space-y-5">
          {sections.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-5 py-3 border-b bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{s.title}</span>
                  <code className="text-xs text-muted-foreground">{s.slug}</code>
                </div>
              </div>
              {s.fields.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                  No fields in this section.
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {s.fields.map((f) => (
                    <FieldRenderer
                      key={f.id}
                      fieldId={f.id}
                      type={f.type}
                      label={f.label}
                      required={Boolean(f.config.required)}
                      helpText={f.config.helpText as string | undefined}
                      config={f.config}
                      value={values[f.id]}
                      onChange={(v) => setField(f.id, v)}
                      uploads={uploads}
                    />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
