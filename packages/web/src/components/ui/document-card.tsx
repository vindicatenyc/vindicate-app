'use client';

import { useState } from 'react';
import {
  FileCheck,
  FileWarning,
  Gavel,
  Receipt,
  FileText,
  Mail,
  FileSignature,
  File,
  Download,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DocumentType } from '@vindicate/shared';
import { DOCUMENT_TYPE_CONFIG } from '@vindicate/shared';
import { cn } from '@/lib/utils';

const DOC_ICON_MAP: Record<DocumentType, LucideIcon> = {
  'validation-letter': FileCheck,
  'dispute-letter': FileWarning,
  'court-document': Gavel,
  'payment-receipt': Receipt,
  'credit-report': FileText,
  'correspondence': Mail,
  'settlement-agreement': FileSignature,
  'other': File,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

export interface DocumentCardProps {
  id: string;
  name: string;
  type: DocumentType;
  mimeType?: string;
  size: number;
  url?: string;
  uploadedAt: string;
  onDownload?: () => Promise<string | null>;
  className?: string;
}

export function DocumentCard({
  name, type, mimeType, size, url, uploadedAt, onDownload, className,
}: DocumentCardProps) {
  const config = DOCUMENT_TYPE_CONFIG[type];
  const IconComponent = DOC_ICON_MAP[type] ?? File;
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isImage = mimeType ? IMAGE_MIME_TYPES.has(mimeType) : false;
  const hasRealFile = url && url !== '#';

  const handleDownload = async () => {
    if (!onDownload || isDownloading) return;
    setIsDownloading(true);
    try {
      const signedUrl = await onDownload();
      if (signedUrl) {
        // For images, show preview; for others, trigger download
        if (isImage) {
          setPreviewUrl(prev => (prev ? null : signedUrl));
        } else {
          const a = document.createElement('a');
          a.href = signedUrl;
          a.download = name;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <IconComponent className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">{name}</h3>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground mt-1">
            {config.label}
          </span>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatFileSize(size)}</span>
            <span>
              {new Date(uploadedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Download button */}
        {hasRealFile && onDownload && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            aria-label={`Download ${name}`}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Image preview */}
      {previewUrl && isImage && (
        <div className="mt-3 rounded-lg overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={name}
            className="w-full max-h-48 object-contain bg-muted/50"
          />
        </div>
      )}
    </div>
  );
}
