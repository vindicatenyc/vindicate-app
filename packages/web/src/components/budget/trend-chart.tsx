'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';
import type { Budget } from '@vindicate/shared';

interface TrendChartProps {
  budgets: Budget[];
  className?: string;
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function TrendChart({ budgets, className }: TrendChartProps) {
  // Get last 3 months sorted chronologically
  const sortedBudgets = [...budgets]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-3);

  if (sortedBudgets.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-5 shadow-soft', className)}>
        <h3 className="text-sm font-medium text-muted-foreground">Monthly Trend</h3>
        <p className="mt-4 text-center text-sm text-muted-foreground">No trend data</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...sortedBudgets.flatMap(b => [b.totalIncome, b.totalExpenses])
  );

  // Calculate trend direction
  const latestBudget = sortedBudgets[sortedBudgets.length - 1];
  const previousBudget = sortedBudgets.length > 1
    ? sortedBudgets[sortedBudgets.length - 2]
    : null;

  let trendDirection: 'up' | 'down' | 'same' = 'same';
  let trendAmount = 0;
  if (previousBudget) {
    const currentNet = latestBudget.totalIncome - latestBudget.totalExpenses;
    const previousNet = previousBudget.totalIncome - previousBudget.totalExpenses;
    trendAmount = currentNet - previousNet;
    trendDirection = trendAmount > 0 ? 'up' : trendAmount < 0 ? 'down' : 'same';
  }

  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-5 shadow-soft', className)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Monthly Trend
        </h3>
        {previousBudget && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trendDirection === 'up'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : trendDirection === 'down'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            {trendDirection === 'up' ? (
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
            ) : trendDirection === 'down' ? (
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Minus className="h-3 w-3" aria-hidden="true" />
            )}
            <span>
              {trendDirection === 'same'
                ? 'No change'
                : `${trendDirection === 'up' ? '+' : ''}${formatCurrency(trendAmount)}`}
            </span>
          </div>
        )}
      </div>

      {/* Side-by-side bar comparison */}
      <div className="mt-4 flex items-end gap-3 sm:gap-6" role="img" aria-label="Monthly income vs expenses comparison">
        {sortedBudgets.map(budget => {
          const incomeHeight = maxValue > 0 ? (budget.totalIncome / maxValue) * 120 : 0;
          const expenseHeight = maxValue > 0 ? (budget.totalExpenses / maxValue) * 120 : 0;

          return (
            <div key={budget.month} className="flex flex-1 flex-col items-center">
              <div className="flex items-end gap-1.5" style={{ height: 130 }}>
                {/* Income bar */}
                <div className="flex w-8 flex-col items-center">
                  <span className="mb-1 text-[10px] text-muted-foreground">
                    {formatCurrency(budget.totalIncome)}
                  </span>
                  <div
                    className="w-full rounded-t bg-green-400 transition-all duration-500"
                    style={{ height: `${incomeHeight}px` }}
                  />
                </div>
                {/* Expense bar */}
                <div className="flex w-8 flex-col items-center">
                  <span className="mb-1 text-[10px] text-muted-foreground">
                    {formatCurrency(budget.totalExpenses)}
                  </span>
                  <div
                    className="w-full rounded-t bg-red-400 transition-all duration-500"
                    style={{ height: `${expenseHeight}px` }}
                  />
                </div>
              </div>
              <span className="mt-2 text-xs font-medium text-muted-foreground">
                {getMonthLabel(budget.month)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-green-400" />
          Income
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-red-400" />
          Expenses
        </div>
      </div>
    </div>
  );
}
