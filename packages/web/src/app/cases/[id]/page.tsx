import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

export default function CaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Detail"
        description={`Viewing case ${params.id}`}
        actions={
          <Button variant="outline" size="sm">
            Edit
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Case details, timeline, documents, and reminders will appear here.
        </p>
      </div>
    </div>
  );
}
