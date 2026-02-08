import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileQuestion
            className="h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Page not found</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="mt-4" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
