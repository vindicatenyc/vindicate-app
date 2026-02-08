'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import type { DocumentType } from '@vindicate/shared';
import { DOCUMENT_TYPE_CONFIG } from '@vindicate/shared';
import { useDocuments } from '@/hooks/use-documents';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

const DOCUMENT_TYPES: DocumentType[] = [
  'validation-letter',
  'dispute-letter',
  'court-document',
  'payment-receipt',
  'credit-report',
  'correspondence',
  'settlement-agreement',
  'other',
];

const MOCK_EXTENSIONS = ['pdf', 'docx', 'png', 'jpg'];
const MOCK_MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpg: 'image/jpeg',
};

interface DocumentUploadProps {
  accountId?: string;
  caseId?: string;
  className?: string;
}

export function DocumentUpload({ accountId, caseId, className }: DocumentUploadProps) {
  const { addDocument } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('other');
  const [description, setDescription] = useState('');

  const createMockDocument = useCallback(
    (fileName?: string) => {
      const ext = MOCK_EXTENSIONS[Math.floor(Math.random() * MOCK_EXTENSIONS.length)];
      const name = fileName || `document-${Date.now()}.${ext}`;
      const size = Math.floor(Math.random() * 500000) + 50000;

      addDocument({
        name,
        type: docType,
        mimeType: MOCK_MIME_TYPES[ext] ?? 'application/octet-stream',
        size,
        url: '#',
        accountId,
        caseId,
        uploadedAt: new Date().toISOString(),
        description: description.trim() || undefined,
      });

      setDescription('');
    },
    [addDocument, docType, description, accountId, caseId]
  );

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
    for (const file of files) {
      createMockDocument(file.name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      createMockDocument(file.name);
    }
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
          Mock upload — files are not actually stored
        </p>
      </div>

      {/* Quick upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => createMockDocument()}
      >
        <Upload className="mr-1.5 h-4 w-4" />
        Create Mock Document
      </Button>
    </div>
  );
}
