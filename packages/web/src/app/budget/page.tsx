import { PiggyBank } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export default function BudgetPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget & Financial Health"
        description="Track income, expenses, and debt repayment progress."
      />

      <EmptyState
        icon={PiggyBank}
        title="No budget set up"
        description="Create a monthly budget to track your income, expenses, and debt repayment strategy."
        actionLabel="Create Budget"
      />
    </div>
  );
}
