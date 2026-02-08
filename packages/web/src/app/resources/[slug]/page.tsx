import { PageHeader } from '@/components/ui/page-header';

export default function ResourceArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Article"
        description={`Viewing: ${params.slug.replace(/-/g, ' ')}`}
      />

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Article content will be rendered here in markdown.
        </p>
      </div>
    </div>
  );
}
