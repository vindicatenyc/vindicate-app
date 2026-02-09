'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4" role="alert">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
          <AlertCircle className="h-8 w-8 text-danger" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button onClick={reset} className="mt-4" size="sm">
          Try again
        </Button>
      </div>
    </div>
  );
}
