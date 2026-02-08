import { PageHeader } from '@/components/ui/page-header';

export default function QuickLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quick Log"
        description="Quickly log a new activity for any account."
      />

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Quick-log form for calls, letters, payments, and notes will appear here.
        </p>
      </div>
    </div>
  );
}
