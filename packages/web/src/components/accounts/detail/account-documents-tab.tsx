'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import type { DocumentType, Document } from '@vindicate/shared';
import { DOCUMENT_TYPE_CONFIG } from '@vindicate/shared';
import { DocumentCard } from '@/components/ui/document-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

interface AccountDocumentsTabProps {
  accountId: string;
}

const ALL_DOC_TYPES: DocumentType[] = [
  'validation-letter', 'dispute-letter', 'court-document', 'payment-receipt',
  'credit-report', 'correspondence', 'settlement-agreement', 'other',
];

export function AccountDocumentsTab({ accountId }: AccountDocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');

  const handleUpload = useCallback(() => {
    const now = new Date().toISOString();
    const mockDoc: Document = {
      id: `doc-${Date.now()}`,
      name: `Document-${documents.length + 1}.pdf`,
      type: 'correspondence',
      mimeType: 'application/pdf',
      size: Math.floor(Math.random() * 500000) + 50000,
      url: '#',
      accountId,
      uploadedAt: now,
      description: 'Mock uploaded document',
    };
    setDocuments(prev => [mockDoc, ...prev]);
  }, [accountId, documents.length]);

  const filteredDocs = typeFilter === 'all'
    ? documents
    : documents.filter(d => d.type === typeFilter);

  if (documents.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Upload documents related to this account — letters, receipts, court filings, and more."
          actionLabel="Upload Document"
          onAction={handleUpload}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="doc-type-filter" className="sr-only">Filter by type</label>
          <select
            id="doc-type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as DocumentType | 'all')}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          >
            <option value="all">All Types</option>
            {ALL_DOC_TYPES.map(dt => (
              <option key={dt} value={dt}>
                {DOCUMENT_TYPE_CONFIG[dt].label}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'}
          </span>
        </div>
        <Button size="sm" onClick={handleUpload}>
          <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Upload Document
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filteredDocs.map(doc => (
          <DocumentCard
            key={doc.id}
            id={doc.id}
            name={doc.name}
            type={doc.type}
            size={doc.size}
            uploadedAt={doc.uploadedAt}
          />
        ))}
      </div>
    </div>
  );
}
