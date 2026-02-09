'use client';

import { useState, useMemo } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { DocumentType } from '@vindicate/shared';
import { DOCUMENT_TYPE_CONFIG } from '@vindicate/shared';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentCard } from '@/components/ui/document-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

const ALL_DOCUMENT_TYPES: DocumentType[] = [
  'validation-letter',
  'dispute-letter',
  'court-document',
  'payment-receipt',
  'credit-report',
  'correspondence',
  'settlement-agreement',
  'other',
];

interface DocumentListProps {
  accountId?: string;
  caseId?: string;
  className?: string;
}

export function DocumentList({ accountId, caseId, className }: DocumentListProps) {
  const { documents, deleteDocument, downloadDocument, getDocumentsForAccount, getDocumentsForCase } = useDocuments();
  const [filterType, setFilterType] = useState<DocumentType | ''>('');

  const baseDocuments = useMemo(() => {
    if (accountId) return getDocumentsForAccount(accountId);
    if (caseId) return getDocumentsForCase(caseId);
    return documents;
  }, [accountId, caseId, documents, getDocumentsForAccount, getDocumentsForCase]);

  const filteredDocuments = useMemo(() => {
    if (!filterType) return baseDocuments;
    return baseDocuments.filter(doc => doc.type === filterType);
  }, [baseDocuments, filterType]);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as DocumentType | '')}
          className={cn(INPUT_CLASS, 'max-w-[200px]')}
          aria-label="Filter by document type"
        >
          <option value="">All Types</option>
          {ALL_DOCUMENT_TYPES.map(type => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_CONFIG[type].label}
            </option>
          ))}
        </select>

        <span className="text-sm text-muted-foreground">
          {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
        </span>
      </div>

      {/* Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="relative group">
              <DocumentCard
                id={doc.id}
                name={doc.name}
                type={doc.type}
                mimeType={doc.mimeType}
                size={doc.size}
                url={doc.url}
                uploadedAt={doc.uploadedAt}
                onDownload={() => downloadDocument(doc)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(doc.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${doc.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No documents"
          description="Upload documents to keep records of correspondence, receipts, and legal filings."
        />
      )}
    </div>
  );
}
