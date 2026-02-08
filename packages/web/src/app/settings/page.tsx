import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your preferences, theme, and account settings."
      />

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Theme, notification preferences, state selection, and profile settings will appear here.
        </p>
      </div>
    </div>
  );
}
