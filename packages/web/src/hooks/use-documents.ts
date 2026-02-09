'use client';

/**
 * Custom hook for managing documents — backed by Supabase Storage + DB
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Document, DocumentType, ProcessingStatus } from '@vindicate/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { documentFromRow, documentToRow } from '@/lib/supabase/mappers';

export type NewDocument = Omit<Document, 'id'>;

export interface UploadFileItem {
  fileName: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

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

export function useDocuments() {
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadFileItem[]>([]);

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

  const uploadDocument = useCallback(async (
    file: File,
    docType: DocumentType,
    description?: string,
    accountId?: string,
    caseId?: string,
  ): Promise<Document | null> => {
    if (!user) { setError('You must be logged in to upload files.'); return null; }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setError(`File type "${file.type || 'unknown'}" is not allowed.`);
      return null;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File "${file.name}" exceeds the 50MB size limit.`);
      return null;
    }

    const fileKey = `${Date.now()}-${file.name}`;

    // Track upload progress
    const progressItem: UploadFileItem = {
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    };
    setUploadProgress(prev => [...prev, progressItem]);

    const updateProgress = (progress: number, status: UploadFileItem['status'], err?: string) => {
      setUploadProgress(prev =>
        prev.map(item =>
          item.fileName === file.name && item.status === 'uploading'
            ? { ...item, progress, status, error: err }
            : item
        )
      );
    };

    try {
      // Upload to Supabase Storage
      updateProgress(10, 'uploading');
      const storagePath = `${user.id}/${fileKey}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        updateProgress(0, 'error', uploadError.message);
        setError(uploadError.message);
        return null;
      }

      updateProgress(70, 'uploading');

      // Insert document metadata into DB
      const row = {
        ...documentToRow({
          name: file.name,
          type: docType,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          url: storagePath,
          accountId,
          caseId,
          uploadedAt: new Date().toISOString(),
          description: description?.trim() || undefined,
        }),
        user_id: user.id,
        uploaded_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('documents')
        .insert(row)
        .select()
        .single();

      if (insertError) {
        // Clean up the uploaded file if DB insert fails
        await supabase.storage.from('documents').remove([storagePath]);
        updateProgress(0, 'error', insertError.message);
        setError(insertError.message);
        return null;
      }

      const document = documentFromRow(data);
      setDocuments(prev => [document, ...prev]);
      updateProgress(100, 'complete');

      // Fire-and-forget: trigger AI processing after successful upload
      triggerProcessing(document.id);

      return document;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      updateProgress(0, 'error', message);
      setError(message);
      return null;
    }
  }, [user, supabase]);

  const downloadDocument = useCallback(async (doc: Document): Promise<string | null> => {
    if (!user) return null;

    // If URL is a storage path (contains user id), create a signed URL
    const storagePath = doc.url;
    if (!storagePath || storagePath === '#') return null;

    const { data, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (signError) {
      setError(signError.message);
      return null;
    }

    return data.signedUrl;
  }, [user, supabase]);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    // Find the document to get its storage path
    const doc = documents.find(d => d.id === id);
    const storagePath = doc?.url;

    // Delete from storage first (skip if mock/old document)
    if (storagePath && storagePath !== '#' && user) {
      await supabase.storage.from('documents').remove([storagePath]);
      // Don't fail the whole delete if storage file is missing
    }

    // Delete metadata row
    const { error: deleteError } = await supabase.from('documents').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return false; }
    setDocuments(prev => prev.filter(d => d.id !== id));
    return true;
  }, [supabase, documents, user]);

  const clearUploadProgress = useCallback(() => {
    setUploadProgress(prev => prev.filter(item => item.status === 'uploading'));
  }, []);

  const removeUploadItem = useCallback((fileName: string) => {
    setUploadProgress(prev => prev.filter(item => item.fileName !== fileName));
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

  // -------------------------------------------------------------------------
  // AI Processing methods
  // -------------------------------------------------------------------------

  const updateDocumentInState = useCallback(
    (id: string, updates: Partial<Document>) => {
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
      );
    },
    []
  );

  const triggerProcessing = useCallback(
    (documentId: string) => {
      // Fire-and-forget — update state optimistically then call API
      updateDocumentInState(documentId, {
        processingStatus: 'processing' as ProcessingStatus,
      });

      fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })
        .then((res) => res.json())
        .then((result) => {
          updateDocumentInState(documentId, {
            processingStatus: result.processingStatus,
            extractedData: result.extractedData ?? undefined,
            extractionConfidence: result.confidence,
            extractionModel: result.model,
            extractionTokensUsed: result.tokensUsed,
            extractionCost: result.cost,
            autoClassifiedType: result.classifiedType ?? undefined,
          });
        })
        .catch(() => {
          updateDocumentInState(documentId, {
            processingStatus: 'failed' as ProcessingStatus,
          });
        });
    },
    [updateDocumentInState]
  );

  const processDocument = useCallback(
    async (documentId: string) => {
      updateDocumentInState(documentId, {
        processingStatus: 'processing' as ProcessingStatus,
      });

      try {
        const res = await fetch('/api/documents/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId }),
        });
        const result = await res.json();

        updateDocumentInState(documentId, {
          processingStatus: result.processingStatus,
          extractedData: result.extractedData ?? undefined,
          extractionConfidence: result.confidence,
          extractionModel: result.model,
          extractionTokensUsed: result.tokensUsed,
          extractionCost: result.cost,
          autoClassifiedType: result.classifiedType ?? undefined,
        });

        return result;
      } catch (err) {
        updateDocumentInState(documentId, {
          processingStatus: 'failed' as ProcessingStatus,
        });
        throw err;
      }
    },
    [updateDocumentInState]
  );

  const reprocessDocument = useCallback(
    async (documentId: string, model?: string) => {
      updateDocumentInState(documentId, {
        processingStatus: 'processing' as ProcessingStatus,
      });

      try {
        const res = await fetch('/api/documents/reprocess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId, model }),
        });
        const result = await res.json();

        updateDocumentInState(documentId, {
          processingStatus: result.processingStatus,
          extractedData: result.extractedData ?? undefined,
          extractionConfidence: result.confidence,
          extractionModel: result.model,
          extractionTokensUsed: result.tokensUsed,
          extractionCost: result.cost,
          autoClassifiedType: result.classifiedType ?? undefined,
        });

        return result;
      } catch (err) {
        updateDocumentInState(documentId, {
          processingStatus: 'failed' as ProcessingStatus,
        });
        throw err;
      }
    },
    [updateDocumentInState]
  );

  const stats = useMemo(() => ({
    totalDocuments: documents.length,
    totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
    byType: documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<DocumentType, number>),
  }), [documents]);

  return {
    documents, isLoading, error, stats, uploadProgress,
    addDocument, uploadDocument, downloadDocument, deleteDocument,
    getDocument, getFilteredDocuments, getDocumentsForAccount, getDocumentsForCase,
    clearUploadProgress, removeUploadItem,
    processDocument, reprocessDocument,
  };
}
