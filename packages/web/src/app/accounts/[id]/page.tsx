import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

export default function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Detail"
        description={`Viewing account ${params.id}`}
        actions={
          <Button variant="outline" size="sm">
            Edit
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Account details, status history, and linked cases will appear here.
        </p>
      </div>
    </div>
  );
}
