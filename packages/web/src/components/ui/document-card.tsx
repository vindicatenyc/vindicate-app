import {
  FileCheck,
  FileWarning,
  Gavel,
  Receipt,
  FileText,
  Mail,
  FileSignature,
  File,
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

export interface DocumentCardProps {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  uploadedAt: string;
  className?: string;
}

export function DocumentCard({ name, type, size, uploadedAt, className }: DocumentCardProps) {
  const config = DOCUMENT_TYPE_CONFIG[type];
  const IconComponent = DOC_ICON_MAP[type] ?? File;

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
      </div>
    </div>
  );
}
