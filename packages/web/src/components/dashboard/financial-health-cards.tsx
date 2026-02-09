'use client';

import { motion } from 'framer-motion';
import { DollarSign, Users, ShieldAlert, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreditScore } from '@/hooks/use-credit-score';
import { formatCurrency } from '@/lib/utils/format-date';
import { CREDIT_RATING_CONFIG } from '@vindicate/shared';
import { staggerContainer, staggerItem } from '@/lib/animations';

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
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Financial health summary"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerItem}>
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
      </motion.div>

      <motion.div variants={staggerItem}>
        <StatCard
          icon={Users}
          label="Active Accounts"
          value={activeCount}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <StatCard
          icon={ShieldAlert}
          label="Open Disputes"
          value={summary.disputedCount}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
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
      </motion.div>
    </motion.div>
  );
}
