'use client';

/**
 * Custom hook for managing documents — backed by Supabase
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Document, DocumentType } from '@vindicate/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { documentFromRow, documentToRow } from '@/lib/supabase/mappers';

export type NewDocument = Omit<Document, 'id'>;

export function useDocuments() {
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setDocuments((data ?? []).map(documentFromRow));
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const addDocument = useCallback(async (doc: NewDocument): Promise<Document | null> => {
    if (!user) return null;
    const row = {
      ...documentToRow(doc),
      user_id: user.id,
      uploaded_at: doc.uploadedAt || new Date().toISOString(),
    };
    const { data, error: insertError } = await supabase
      .from('documents')
      .insert(row)
      .select()
      .single();
    if (insertError) { setError(insertError.message); return null; }
    const document = documentFromRow(data);
    setDocuments(prev => [document, ...prev]);
    return document;
  }, [user, supabase]);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase.from('documents').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return false; }
    setDocuments(prev => prev.filter(d => d.id !== id));
    return true;
  }, [supabase]);

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
    documents, isLoading, error, stats,
    addDocument, deleteDocument, getDocument,
    getFilteredDocuments, getDocumentsForAccount, getDocumentsForCase,
  };
}
