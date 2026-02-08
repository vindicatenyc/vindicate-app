import { Upload } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export default function CreditReportImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Credit Report"
        description="Upload your credit report to automatically import accounts."
      />

      <EmptyState
        icon={Upload}
        title="Upload your credit report"
        description="Drag and drop a PDF credit report or click to browse. We'll extract your accounts automatically."
        actionLabel="Choose File"
      />
    </div>
  );
}
