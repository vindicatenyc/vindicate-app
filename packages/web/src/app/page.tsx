'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import {
  FinancialHealthCards,
  RecentActivity,
  QuickActions,
  VinnyGreeting,
  DebtProgressRing,
} from '@/components/dashboard';
import { VinnyTipCard } from '@/components/vinny/vinny-tip-card';
import { useAccounts } from '@/hooks/use-accounts';
import { generateDashboardTip } from '@/lib/vinny/tip-generator';

export default function DashboardPage() {
  const { accounts } = useAccounts();

  const tip = useMemo(() => generateDashboardTip(accounts), [accounts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your financial recovery overview at a glance."
        actions={<QuickActions />}
      />

      {/* Vinny greeting */}
      <VinnyGreeting />

      {/* Vinny proactive tip */}
      {tip && <VinnyTipCard tip={tip} />}

      {/* Financial health cards */}
      <FinancialHealthCards />

      {/* Progress ring + Activity feed side by side on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DebtProgressRing />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
