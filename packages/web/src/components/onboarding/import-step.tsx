'use client';

import { Upload, PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ImportStepProps {
  onComplete: () => void;
}

export function ImportStep({ onComplete }: ImportStepProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Add Your Accounts
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Get started by importing your credit report or adding accounts manually.
        No judgment here — we are in this together.
      </p>

      <div className="w-full max-w-sm space-y-3 mb-8">
        <Link href="/accounts/import" onClick={onComplete}>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">
                Import Credit Report
              </p>
              <p className="text-xs text-muted-foreground">
                Upload your report and we will parse it
              </p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" aria-hidden="true" />
          </div>
        </Link>

        <Link href="/accounts/new" onClick={onComplete}>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors cursor-pointer mt-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
              <PlusCircle className="h-5 w-5 text-secondary" aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">
                Add Accounts Manually
              </p>
              <p className="text-xs text-muted-foreground">
                Enter your debt accounts one by one
              </p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" aria-hidden="true" />
          </div>
        </Link>
      </div>

      <Button variant="ghost" onClick={onComplete} className="text-muted-foreground">
        Skip for Now
      </Button>
    </div>
  );
}
