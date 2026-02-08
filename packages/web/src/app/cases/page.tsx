'use client';

import { PageHeader } from '@/components/ui/page-header';
import { CaseList } from '@/components/cases/case-list';

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases"
        description="Manage disputes, complaints, and legal proceedings."
      />

      <CaseList />
    </div>
  );
}
