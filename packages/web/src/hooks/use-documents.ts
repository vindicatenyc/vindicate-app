'use client';

/**
 * Custom hook for managing documents
 * Provides CRUD operations on document data (mock)
 */

import { useState, useCallback, useMemo } from 'react';
import type { Document, DocumentType } from '@vindicate/shared';

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    name: 'Debt Validation Letter - IC System.pdf',
    type: 'validation-letter',
    mimeType: 'application/pdf',
    size: 245000,
    url: '#',
    accountId: 'acc-001-nyu-medical',
    uploadedAt: '2026-01-20T10:15:00Z',
    description: 'Debt validation request sent to IC System via certified mail',
    tags: ['nyu', 'validation'],
  },
  {
    id: 'doc-002',
    name: 'Equifax Dispute Confirmation.pdf',
    type: 'dispute-letter',
    mimeType: 'application/pdf',
    size: 189000,
    url: '#',
    accountId: 'acc-003-synchrony',
    caseId: 'case-001',
    uploadedAt: '2026-01-20T15:30:00Z',
    description: 'Confirmation of dispute filed with Equifax',
    tags: ['equifax', 'dispute'],
  },
  {
    id: 'doc-003',
    name: 'Capital One Payment Plan Agreement.pdf',
    type: 'settlement-agreement',
    mimeType: 'application/pdf',
    size: 312000,
    url: '#',
    accountId: 'acc-002-capital-one',
    uploadedAt: '2025-10-15T12:00:00Z',
    description: 'Payment plan terms: $175/month for 18 months at 0% interest',
    tags: ['capital-one', 'payment-plan'],
  },
  {
    id: 'doc-004',
    name: 'ConEd Settlement Receipt.pdf',
    type: 'payment-receipt',
    mimeType: 'application/pdf',
    size: 98000,
    url: '#',
    accountId: 'acc-004-con-edison',
    uploadedAt: '2025-12-20T11:30:00Z',
    description: 'Settlement payment confirmation - $534 paid',
    tags: ['con-edison', 'settled'],
  },
  {
    id: 'doc-005',
    name: 'IC System Validation Response.pdf',
    type: 'correspondence',
    mimeType: 'application/pdf',
    size: 456000,
    url: '#',
    accountId: 'acc-001-nyu-medical',
    caseId: 'case-002',
    uploadedAt: '2026-02-03T18:30:00Z',
    description: 'Validation documents received from IC System',
    tags: ['nyu', 'validation-response'],
  },
];

export type NewDocument = Omit<Document, 'id'>;

function generateId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);

  const addDocument = useCallback((doc: NewDocument): Document => {
    const newDoc: Document = {
      ...doc,
      id: generateId(),
    };
    setDocuments(prev => [...prev, newDoc]);
    return newDoc;
  }, []);

  const deleteDocument = useCallback((id: string): boolean => {
    let deleted = false;
    setDocuments(prev => {
      const result = prev.filter(doc => {
        if (doc.id === id) {
          deleted = true;
          return false;
        }
        return true;
      });
      return result;
    });
    return deleted;
  }, []);

  const getDocument = useCallback((id: string): Document | undefined => {
    return documents.find(doc => doc.id === id);
  }, [documents]);

  const getFilteredDocuments = useCallback((filterType?: DocumentType): Document[] => {
    if (!filterType) return documents;
    return documents.filter(doc => doc.type === filterType);
  }, [documents]);

  const getDocumentsForAccount = useCallback((accountId: string): Document[] => {
    return documents.filter(doc => doc.accountId === accountId);
  }, [documents]);

  const getDocumentsForCase = useCallback((caseId: string): Document[] => {
    return documents.filter(doc => doc.caseId === caseId);
  }, [documents]);

  const stats = useMemo(() => ({
    totalDocuments: documents.length,
    totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
    byType: documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<DocumentType, number>),
  }), [documents]);

  return {
    documents,
    stats,
    addDocument,
    deleteDocument,
    getDocument,
    getFilteredDocuments,
    getDocumentsForAccount,
    getDocumentsForCase,
  };
}
