'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import type { DocumentType } from '@vindicate/shared';
import { DOCUMENT_TYPE_CONFIG } from '@vindicate/shared';
import { useDocuments } from '@/hooks/use-documents';
import type { UploadFileItem } from '@/hooks/use-documents';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

const DOCUMENT_TYPES: DocumentType[] = [
  'credit-report',
  'bank-statement',
  'tax-document',
  'income-verification',
  'medical-bill',
  'validation-letter',
  'dispute-letter',
  'court-document',
  'payment-receipt',
  'correspondence',
  'settlement-agreement',
  'identity-document',
  'other',
];

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
]);

const MAX_FILE_SIZE = 52428800; // 50MB

const ACCEPT_STRING = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
].join(',');

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileValidationError {
  fileName: string;
  reason: string;
}

interface DocumentUploadProps {
  accountId?: string;
  caseId?: string;
  className?: string;
}

export function DocumentUpload({ accountId, caseId, className }: DocumentUploadProps) {
  const { uploadDocument, uploadProgress, removeUploadItem } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('other');
  const [description, setDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      return `"${file.name}" has unsupported type (.${ext}). Allowed: PDF, images, Word, text, CSV.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is ${formatFileSize(file.size)} — exceeds the 50MB limit.`;
    }
    return null;
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    setValidationErrors([]);
    const errors: FileValidationError[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        errors.push({ fileName: file.name, reason: err });
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
    }

    // Upload valid files
    for (const file of validFiles) {
      await uploadDocument(file, docType, description, accountId, caseId);
    }

    if (validFiles.length > 0) {
      setDescription('');
    }
  }, [validateFile, uploadDocument, docType, description, accountId, caseId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Document type selector */}
      <div>
        <label htmlFor="doc-type" className="block text-sm font-medium text-foreground mb-1">
          Document Type
        </label>
        <select
          id="doc-type"
          value={docType}
          onChange={e => setDocType(e.target.value as DocumentType)}
          className={INPUT_CLASS}
        >
          {DOCUMENT_TYPES.map(type => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_CONFIG[type].label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="doc-desc" className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <input
          id="doc-desc"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description of this document..."
          className={INPUT_CLASS}
        />
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {err.reason}
            </p>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-muted/30'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_STRING}
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Choose files to upload"
        />

        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl mb-3 transition-colors',
          isDragOver ? 'bg-primary/10' : 'bg-muted'
        )}>
          {isDragOver ? (
            <FileText className="h-6 w-6 text-primary" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <p className="text-sm font-medium text-foreground">
          {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          PDF, images, Word, text, CSV — up to 50MB
        </p>
      </div>

      {/* Upload queue */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Uploads
          </h4>
          {uploadProgress.map((item) => (
            <UploadQueueItem
              key={item.fileName}
              item={item}
              onRemove={() => removeUploadItem(item.fileName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadQueueItem({ item, onRemove }: { item: UploadFileItem; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {/* Status icon */}
      <div className="shrink-0">
        {item.status === 'uploading' && (
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        )}
        {item.status === 'complete' && (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        )}
        {item.status === 'error' && (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
      </div>

      {/* File info + progress */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{item.fileName}</p>
        {item.status === 'uploading' && (
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
        {item.status === 'error' && item.error && (
          <p className="text-xs text-destructive mt-0.5 truncate">{item.error}</p>
        )}
      </div>

      {/* Remove button */}
      {item.status !== 'uploading' && (
        <button
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Remove ${item.fileName} from list`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
