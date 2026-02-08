import { Wallet, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Track and manage all your debt accounts."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Account
          </Button>
        }
      />

      <EmptyState
        icon={Wallet}
        title="No accounts yet"
        description="Add your first account to start tracking your debt recovery journey."
        actionLabel="Add Account"
        actionHref="/accounts/new"
      />
    </div>
  );
}
