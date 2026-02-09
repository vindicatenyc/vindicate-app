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
  Landmark,
  FileSpreadsheet,
  BadgeDollarSign,
  UserCheck,
  HeartPulse,
  AlertCircle,
  RotateCw,
  Sparkles,
  Eye,
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DocumentType, ProcessingStatus } from '@vindicate/shared';
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
  'bank-statement': Landmark,
  'tax-document': FileSpreadsheet,
  'income-verification': BadgeDollarSign,
  'identity-document': UserCheck,
  'medical-bill': HeartPulse,
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
  processingStatus?: ProcessingStatus;
  extractionConfidence?: number;
  autoClassifiedType?: string;
  onDownload?: () => Promise<string | null>;
  onRetry?: () => void;
  onViewData?: () => void;
  className?: string;
}

function ProcessingBadge({
  status,
  confidence,
  onRetry,
  onViewData,
}: {
  status?: ProcessingStatus;
  confidence?: number;
  onRetry?: () => void;
  onViewData?: () => void;
}) {
  if (!status || status === 'skipped') return null;

  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          Pending
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary animate-pulse">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Processing...
        </span>
      );
    case 'completed':
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
            <Sparkles className="h-2.5 w-2.5" />
            Extracted
            {confidence != null && confidence < 1 && (
              <span className="opacity-70">{Math.round(confidence * 100)}%</span>
            )}
          </span>
          {onViewData && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewData(); }}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Eye className="h-2.5 w-2.5" />
              View
            </button>
          )}
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-400">
            <AlertCircle className="h-2.5 w-2.5" />
            Failed
          </span>
          {onRetry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <RotateCw className="h-2.5 w-2.5" />
              Retry
            </button>
          )}
        </div>
      );
    case 'needs_review':
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-2.5 w-2.5" />
            Review needed
          </span>
          {onViewData && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewData(); }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
            >
              <Eye className="h-2.5 w-2.5" />
              Review
            </button>
          )}
        </div>
      );
    default:
      return null;
  }
}

export function DocumentCard({
  name, type, mimeType, size, url, uploadedAt, processingStatus, extractionConfidence, autoClassifiedType, onDownload, onRetry, onViewData, className,
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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {config.label}
            </span>
            {autoClassifiedType && autoClassifiedType !== type && (
              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                AI: {DOCUMENT_TYPE_CONFIG[autoClassifiedType as DocumentType]?.label ?? autoClassifiedType}
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <ProcessingBadge
              status={processingStatus}
              confidence={extractionConfidence}
              onRetry={onRetry}
              onViewData={onViewData}
            />
          </div>
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
