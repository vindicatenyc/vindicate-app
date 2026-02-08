'use client';

import { DollarSign, Users, ShieldAlert, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreditScore } from '@/hooks/use-credit-score';
import { formatCurrency } from '@/lib/utils/format-date';
import { CREDIT_RATING_CONFIG } from '@vindicate/shared';

export function FinancialHealthCards() {
  const { accounts, summary } = useAccounts();
  const { creditScore, getScoreChange, getRatingInfo } = useCreditScore();

  const scoreChange = getScoreChange();
  const ratingInfo = getRatingInfo(creditScore.score);

  // Active accounts: not settled and not paid-in-full
  const activeCount = accounts.filter(
    a => a.status !== 'settled' && a.status !== 'paid-in-full'
  ).length;

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Financial health summary"
    >
      <StatCard
        icon={DollarSign}
        label="Total Debt"
        value={formatCurrency(summary.totalCurrentDebt)}
        trend={
          summary.totalOriginalDebt > summary.totalCurrentDebt
            ? {
                direction: 'down',
                value: `${Math.round(((summary.totalOriginalDebt - summary.totalCurrentDebt) / summary.totalOriginalDebt) * 100)}%`,
                positive: true,
              }
            : undefined
        }
      />

      <StatCard
        icon={Users}
        label="Active Accounts"
        value={activeCount}
      />

      <StatCard
        icon={ShieldAlert}
        label="Open Disputes"
        value={summary.disputedCount}
      />

      <StatCard
        icon={TrendingUp}
        label="Credit Score"
        value={creditScore.score}
        trend={
          scoreChange.direction !== 'same'
            ? {
                direction: scoreChange.direction,
                value: `${scoreChange.change} pts`,
                positive: scoreChange.direction === 'up',
              }
            : undefined
        }
        className={ratingInfo.color.replace('text-', 'border-l-4 border-l-')}
      />
    </div>
  );
}
