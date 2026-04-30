'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, CircleDot, Cloud, Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { discardDraftAction, publishPageAction } from './actions';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type Props = {
  page: { id: string; slug: string; status: 'draft' | 'published' };
  status: SaveStatus;
  savedAt: number | null;
  hasUnpublishedChanges: boolean;
  onAfterPublish: () => void;
  onAfterDiscard: () => void;
};

export function PublishBar({
  page,
  status,
  savedAt,
  hasUnpublishedChanges,
  onAfterPublish,
  onAfterDiscard,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [discardOpen, setDiscardOpen] = useState(false);

  function publish() {
    startTransition(async () => {
      await publishPageAction({ pageId: page.id, pageSlug: page.slug });
      onAfterPublish();
    });
  }

  function discard() {
    startTransition(async () => {
      await discardDraftAction({ pageId: page.id, pageSlug: page.slug });
      setDiscardOpen(false);
      onAfterDiscard();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        {page.status === 'published' ? (
          <Badge variant="success">published</Badge>
        ) : (
          <Badge variant="muted">draft</Badge>
        )}
        <SaveIndicator status={status} savedAt={savedAt} />
        {hasUnpublishedChanges && status !== 'dirty' && status !== 'saving' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleDot className="h-3 w-3 text-amber-500" />
            unpublished changes
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasUnpublishedChanges || pending}
              title={hasUnpublishedChanges ? 'Discard draft changes' : 'No draft changes'}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Discard draft
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Discard draft changes?</DialogTitle>
              <DialogDescription>
                Resets every field to its currently published value. Anything you've typed since
                the last publish will be lost. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDiscardOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={discard} disabled={pending}>
                {pending ? 'Discarding…' : 'Discard draft'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          size="sm"
          onClick={publish}
          disabled={pending || status === 'saving' || status === 'dirty'}
          title={
            status === 'dirty' || status === 'saving'
              ? 'Wait for auto-save before publishing'
              : 'Publish current draft to the public API'
          }
        >
          <Cloud className="h-3.5 w-3.5" />
          {pending ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </div>
  );
}

function SaveIndicator({ status, savedAt }: { status: SaveStatus; savedAt: number | null }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (status !== 'saved' || !savedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 10000);
    return () => clearInterval(id);
  }, [status, savedAt]);

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'dirty') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <CircleDot className="h-3 w-3 text-blue-500" /> Unsaved
      </span>
    );
  }
  if (status === 'saved' && savedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3 w-3 text-emerald-500" /> Saved {formatRelative(savedAt, tick)}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" /> Save failed
      </span>
    );
  }
  return null;
}

function formatRelative(savedAt: number, _tick: number): string {
  const seconds = Math.floor((Date.now() - savedAt) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(savedAt).toLocaleDateString();
}
