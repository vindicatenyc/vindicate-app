'use client';

import { useState, useMemo, useCallback } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { Document, DocumentType } from '@vindicate/shared';
import { DOCUMENT_TYPE_CONFIG } from '@vindicate/shared';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentCard } from '@/components/ui/document-card';
import { ExtractionReview } from '@/components/documents/extraction-review';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

const ALL_DOCUMENT_TYPES: DocumentType[] = [
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

interface DocumentListProps {
  accountId?: string;
  caseId?: string;
  className?: string;
}

export function DocumentList({ accountId, caseId, className }: DocumentListProps) {
  const {
    documents,
    deleteDocument,
    downloadDocument,
    reprocessDocument,
    normalizeDocument,
    skipDocument,
    getDocumentsForAccount,
    getDocumentsForCase,
  } = useDocuments();

  const [filterType, setFilterType] = useState<DocumentType | ''>('');
  const [reviewDoc, setReviewDoc] = useState<Document | null>(null);

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

  const handleViewData = useCallback((doc: Document) => {
    setReviewDoc(doc);
  }, []);

  const handleRetry = useCallback(async (documentId: string) => {
    await reprocessDocument(documentId, 'gpt-4.1');
  }, [reprocessDocument]);

  const handleNormalize = useCallback(async (documentId: string, selections?: Record<string, unknown>) => {
    await normalizeDocument(documentId, selections);
  }, [normalizeDocument]);

  const handleReprocess = useCallback(async (documentId: string) => {
    await reprocessDocument(documentId, 'gpt-4.1');
  }, [reprocessDocument]);

  const handleSkip = useCallback((documentId: string) => {
    skipDocument(documentId);
  }, [skipDocument]);

  // Keep review doc in sync with documents state (e.g. after reprocess)
  const activeReviewDoc = useMemo(() => {
    if (!reviewDoc) return null;
    return documents.find(d => d.id === reviewDoc.id) ?? reviewDoc;
  }, [reviewDoc, documents]);

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
                processingStatus={doc.processingStatus}
                extractionConfidence={doc.extractionConfidence}
                autoClassifiedType={doc.autoClassifiedType}
                onDownload={() => downloadDocument(doc)}
                onRetry={() => handleRetry(doc.id)}
                onViewData={() => handleViewData(doc)}
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

      {/* Extraction Review Sheet */}
      {activeReviewDoc && (
        <ExtractionReview
          document={activeReviewDoc}
          open={!!reviewDoc}
          onOpenChange={(open) => { if (!open) setReviewDoc(null); }}
          onNormalize={handleNormalize}
          onReprocess={handleReprocess}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
}
