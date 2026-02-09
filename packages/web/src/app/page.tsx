'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

export default function DashboardPage() {
  const { accounts } = useAccounts();

  const tip = useMemo(() => generateDashboardTip(accounts), [accounts]);

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
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
      <motion.div
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="lg:col-span-1" variants={staggerItem}>
          <DebtProgressRing />
        </motion.div>
        <motion.div className="lg:col-span-2" variants={staggerItem}>
          <RecentActivity />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
