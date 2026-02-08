'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StepUploadProps {
  onComplete: () => void;
}

export function StepUpload({ onComplete }: StepUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleUpload = useCallback(() => {
    setFileName('credit-report-2026.pdf');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onComplete();
    }, 2000);
  }, [onComplete]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleUpload();
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground">Processing your credit report...</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyzing {fileName} and extracting account information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Upload Your Credit Report</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF credit report and we&apos;ll extract your accounts automatically.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUpload}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleUpload(); }}
        aria-label="Upload credit report PDF. Click or drag and drop."
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          Drag and drop your credit report here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or click to browse (PDF format)
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Accepted formats</p>
          <p>PDF files from Equifax, Experian, or TransUnion</p>
        </div>
      </div>
    </div>
  );
}
