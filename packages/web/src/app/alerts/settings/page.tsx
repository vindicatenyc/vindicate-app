import { PageHeader } from '@/components/ui/page-header';

export default function AlertSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Preferences"
        description="Choose which notifications you want to receive."
      />

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Notification preference toggles will appear here.
        </p>
      </div>
    </div>
  );
}
