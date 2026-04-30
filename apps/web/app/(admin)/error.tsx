'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin error]', error);
  }, [error]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        {error.digest && (
          <code className="text-xs text-muted-foreground block">id: {error.digest}</code>
        )}
        <Button onClick={reset} variant="outline">
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </Card>
    </div>
  );
}
