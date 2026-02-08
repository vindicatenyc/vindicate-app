'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ActivityTimeline } from '@/components/activity/activity-timeline';

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Timeline"
        description="Track all interactions with creditors and collectors."
        actions={
          <Link href="/activity/log">
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Log Activity
            </Button>
          </Link>
        }
      />

      <ActivityTimeline />
    </div>
  );
}
