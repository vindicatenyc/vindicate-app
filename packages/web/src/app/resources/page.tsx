import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Center"
        description="Know your rights. Access guides, templates, and educational content."
      />

      <EmptyState
        icon={BookOpen}
        title="Resources loading..."
        description="FDCPA/FCRA rights summaries, template letters, glossary terms, and articles will appear here."
      />
    </div>
  );
}
