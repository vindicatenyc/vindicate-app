'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';

interface BudgetBarProps {
  totalIncome: number;
  totalExpenses: number;
  className?: string;
}

export function BudgetBar({
  totalIncome,
  totalExpenses,
  className,
}: BudgetBarProps) {
  const surplus = totalIncome - totalExpenses;
  const isSurplus = surplus >= 0;
  const expensePercent = totalIncome > 0
    ? Math.min((totalExpenses / totalIncome) * 100, 100)
    : 0;
  const surplusPercent = totalIncome > 0
    ? Math.max(100 - expensePercent, 0)
    : 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-soft',
        className
      )}
    >
      <h3 className="text-sm font-medium text-muted-foreground">
        Income vs Expenses
      </h3>

      <div className="mt-4">
        {/* Bar */}
        <div
          className="flex h-8 w-full overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`Budget bar: ${formatCurrency(totalExpenses)} expenses out of ${formatCurrency(totalIncome)} income`}
        >
          <div
            className="flex items-center justify-center bg-red-400 text-xs font-medium text-white transition-all duration-500"
            style={{ width: `${expensePercent}%` }}
          >
            {expensePercent > 15 && `${Math.round(expensePercent)}%`}
          </div>
          {isSurplus && surplusPercent > 0 && (
            <div
              className="flex items-center justify-center bg-green-400 text-xs font-medium text-white transition-all duration-500"
              style={{ width: `${surplusPercent}%` }}
            >
              {surplusPercent > 15 && `${Math.round(surplusPercent)}%`}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <span className="text-muted-foreground">
                Expenses ({formatCurrency(totalExpenses)})
              </span>
            </div>
            {isSurplus && (
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="text-muted-foreground">
                  Available ({formatCurrency(surplus)})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Available for debt callout */}
        {isSurplus && surplus > 0 && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              {formatCurrency(surplus)} available for debt payment
            </p>
            <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
              This is your monthly surplus after all expenses
            </p>
          </div>
        )}

        {!isSurplus && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Over budget by {formatCurrency(Math.abs(surplus))}
            </p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              Consider reducing expenses to free up money for debt repayment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
