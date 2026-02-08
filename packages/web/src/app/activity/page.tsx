import { Activity, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Timeline"
        description="Track all interactions with creditors and collectors."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Log Activity
          </Button>
        }
      />

      <EmptyState
        icon={Activity}
        title="No activity logged"
        description="Start logging phone calls, letters, and payments to build your timeline."
        actionLabel="Log Activity"
        actionHref="/activity/log"
      />
    </div>
  );
}
