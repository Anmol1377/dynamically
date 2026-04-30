import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
