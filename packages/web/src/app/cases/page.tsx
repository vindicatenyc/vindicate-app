import { Briefcase, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases"
        description="Manage disputes, complaints, and legal proceedings."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Case
          </Button>
        }
      />

      <EmptyState
        icon={Briefcase}
        title="No cases yet"
        description="Create a case to start tracking disputes, complaints, or legal actions."
        actionLabel="Create Case"
      />
    </div>
  );
}
