'use client';

import { PageHeader } from '@/components/ui/page-header';
import { NotificationSettings } from '@/components/notifications/notification-settings';

export default function AlertSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Preferences"
        description="Choose which notifications you want to receive."
      />

      <NotificationSettings />
    </div>
  );
}
