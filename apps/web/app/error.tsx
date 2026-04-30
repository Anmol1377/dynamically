'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[error.tsx]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <code className="text-xs text-muted-foreground block">id: {error.digest}</code>
        )}
        <Button onClick={reset} variant="outline">
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}
