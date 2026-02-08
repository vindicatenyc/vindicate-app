'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ActivityForm } from '@/components/activity/activity-form';

function ActivityFormWrapper() {
  return <ActivityForm />;
}

export default function QuickLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Activity"
        description="Record a phone call, letter, payment, or other interaction."
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading form...</div>}>
          <ActivityFormWrapper />
        </Suspense>
      </div>
    </div>
  );
}
