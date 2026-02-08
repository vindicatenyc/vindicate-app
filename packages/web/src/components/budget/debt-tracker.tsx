'use client';

import { useMemo } from 'react';
import { Calculator, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';
import { useAccounts } from '@/hooks/use-accounts';
import {
  accountsToDebtInfo,
  calculateDebtPlan,
  type DebtStrategy,
} from '@/lib/utils/debt-calculator';
import { DebtStrategyToggle } from './debt-strategy-toggle';
import { DebtAccountRow } from './debt-account-row';

interface DebtTrackerProps {
  strategy: DebtStrategy;
  onStrategyChange: (strategy: DebtStrategy) => void;
  availableForDebt: number;
  className?: string;
}

export function DebtTracker({
  strategy,
  onStrategyChange,
  availableForDebt,
  className,
}: DebtTrackerProps) {
  const { accounts } = useAccounts();

  const debtInfos = useMemo(
    () => accountsToDebtInfo(accounts),
    [accounts]
  );

  const plan = useMemo(
    () => calculateDebtPlan(debtInfos, strategy, availableForDebt),
    [debtInfos, strategy, availableForDebt]
  );

  // Also calculate the other strategy for comparison
  const otherStrategy: DebtStrategy = strategy === 'snowball' ? 'avalanche' : 'snowball';
  const otherPlan = useMemo(
    () => calculateDebtPlan(debtInfos, otherStrategy, availableForDebt),
    [debtInfos, otherStrategy, availableForDebt]
  );

  const interestDiff = Math.abs(plan.totalInterest - otherPlan.totalInterest);

  // Map of original balances for progress bars
  const originalBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of accounts) {
      map[a.id] = a.originalBalance;
    }
    return map;
  }, [accounts]);

  if (debtInfos.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-5 shadow-soft', className)}>
        <h3 className="font-medium text-foreground">Debt Repayment Tracker</h3>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No active debts to track
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-5 shadow-soft', className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-medium text-foreground">Debt Repayment Tracker</h3>
        <DebtStrategyToggle strategy={strategy} onChange={onStrategyChange} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {strategy === 'snowball'
          ? 'Pay off smallest balances first for quick wins'
          : 'Pay off highest interest rates first to save money'}
      </p>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Est. Payoff</p>
            <p className="text-sm font-semibold text-foreground">
              {plan.estimatedMonthsToPayoff > 0
                ? `${plan.estimatedMonthsToPayoff} months`
                : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Total Interest</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(plan.totalInterest)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <Calculator className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Total Owed</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(plan.totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Interest comparison */}
      {interestDiff > 0 && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {plan.totalInterest < otherPlan.totalInterest
              ? `You save ${formatCurrency(interestDiff)} in interest with ${strategy} vs ${otherStrategy}`
              : `Switching to ${otherStrategy} would save ${formatCurrency(interestDiff)} in interest`}
          </p>
        </div>
      )}

      {/* Account list */}
      <div className="mt-4 space-y-3">
        {plan.accounts.map(account => (
          <DebtAccountRow
            key={account.id}
            account={account}
            originalBalance={originalBalances[account.id]}
          />
        ))}
      </div>
    </div>
  );
}
