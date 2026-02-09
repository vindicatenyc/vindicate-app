'use client';

import { DocumentUpload } from '@/components/documents/document-upload';
import { DocumentList } from '@/components/documents/document-list';

interface AccountDocumentsTabProps {
  accountId: string;
}

export function AccountDocumentsTab({ accountId }: AccountDocumentsTabProps) {
  return (
    <div className="space-y-6">
      <DocumentUpload accountId={accountId} />
      <DocumentList accountId={accountId} />
    </div>
  );
}
