'use client';

import { DollarSign, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';

interface BudgetOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  className?: string;
}

export function BudgetOverview({
  totalIncome,
  totalExpenses,
  className,
}: BudgetOverviewProps) {
  const net = totalIncome - totalExpenses;
  const isSurplus = net >= 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-soft',
        className
      )}
    >
      <h3 className="text-sm font-medium text-muted-foreground">
        Monthly Summary
      </h3>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <TrendingUp className="h-5 w-5 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
            <TrendingDown className="h-5 w-5 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              isSurplus
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            )}
          >
            <DollarSign
              className={cn(
                'h-5 w-5',
                isSurplus ? 'text-green-600' : 'text-red-600'
              )}
              aria-hidden="true"
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {isSurplus ? 'Surplus' : 'Deficit'}
            </p>
            <p
              className={cn(
                'text-lg font-semibold',
                isSurplus ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isSurplus ? '+' : ''}
              {formatCurrency(net)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
