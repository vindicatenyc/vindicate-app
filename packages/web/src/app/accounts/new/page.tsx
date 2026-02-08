import { PageHeader } from '@/components/ui/page-header';

export default function NewAccountPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Account"
        description="Manually add a new debt account to track."
      />

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Account creation form will appear here.
        </p>
      </div>
    </div>
  );
}
