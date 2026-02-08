'use client';

import {
  Home,
  Zap,
  UtensilsCrossed,
  Car,
  Heart,
  Shield,
  CreditCard,
  User,
  GraduationCap,
  PiggyBank,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';
import { EXPENSE_CATEGORY_CONFIG } from '@vindicate/shared';
import type { ExpenseCategory } from '@vindicate/shared';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  housing: 'bg-blue-500',
  utilities: 'bg-yellow-500',
  food: 'bg-orange-500',
  transportation: 'bg-purple-500',
  healthcare: 'bg-red-500',
  insurance: 'bg-teal-500',
  'debt-payments': 'bg-rose-600',
  personal: 'bg-pink-500',
  education: 'bg-indigo-500',
  savings: 'bg-green-500',
  other: 'bg-gray-500',
};

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  housing: Home,
  utilities: Zap,
  food: UtensilsCrossed,
  transportation: Car,
  healthcare: Heart,
  insurance: Shield,
  'debt-payments': CreditCard,
  personal: User,
  education: GraduationCap,
  savings: PiggyBank,
  other: MoreHorizontal,
};

interface SpendingChartProps {
  expensesByCategory: Record<string, number>;
  totalExpenses: number;
  className?: string;
}

export function SpendingChart({
  expensesByCategory,
  totalExpenses,
  className,
}: SpendingChartProps) {
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .filter(([, amount]) => amount > 0);

  if (sortedCategories.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-5 shadow-soft', className)}>
        <h3 className="text-sm font-medium text-muted-foreground">Spending Breakdown</h3>
        <p className="mt-4 text-center text-sm text-muted-foreground">No expense data</p>
      </div>
    );
  }

  const maxAmount = sortedCategories[0][1];

  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-5 shadow-soft', className)}
    >
      <h3 className="text-sm font-medium text-muted-foreground">
        Spending Breakdown
      </h3>

      {/* Horizontal bar chart */}
      <div className="mt-4 space-y-3" role="list" aria-label="Expense breakdown by category">
        {sortedCategories.map(([cat, amount]) => {
          const category = cat as ExpenseCategory;
          const config = EXPENSE_CATEGORY_CONFIG[category];
          const Icon = CATEGORY_ICONS[category];
          const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
          const barWidth = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

          return (
            <div key={cat} role="listitem">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm text-foreground">
                    {config?.label ?? cat}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(amount)}
                  </span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    CATEGORY_COLORS[category] || 'bg-gray-500'
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Screen reader accessible data table */}
      <table className="sr-only">
        <caption>Expense breakdown by category</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {sortedCategories.map(([cat, amount]) => {
            const category = cat as ExpenseCategory;
            const config = EXPENSE_CATEGORY_CONFIG[category];
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            return (
              <tr key={cat}>
                <td>{config?.label ?? cat}</td>
                <td>{formatCurrency(amount)}</td>
                <td>{Math.round(percentage)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
