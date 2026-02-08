import { Bell, Settings } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Stay on top of deadlines, payments, and updates."
        actions={
          <Link href="/alerts/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-1.5 h-4 w-4" />
              Preferences
            </Button>
          </Link>
        }
      />

      <EmptyState
        icon={Bell}
        title="All caught up!"
        description="You have no new notifications. We'll alert you about upcoming deadlines and important updates."
      />
    </div>
  );
}
