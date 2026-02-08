'use client';

import { PageHeader } from '@/components/ui/page-header';
import {
  FinancialHealthCards,
  RecentActivity,
  QuickActions,
  VinnyGreeting,
  DebtProgressRing,
} from '@/components/dashboard';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your financial recovery overview at a glance."
        actions={<QuickActions />}
      />

      {/* Vinny greeting */}
      <VinnyGreeting />

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
