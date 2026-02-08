'use client';

import { ProgressRing } from '@/components/ui/progress-ring';
import { useAccounts } from '@/hooks/use-accounts';
import { formatCurrency } from '@/lib/utils/format-date';

export function DebtProgressRing() {
  const { summary } = useAccounts();

  const totalOriginal = summary.totalOriginalDebt;
  const totalCurrent = summary.totalCurrentDebt;
  const amountPaid = totalOriginal - totalCurrent;
  const percentPaid = totalOriginal > 0 ? (amountPaid / totalOriginal) * 100 : 0;

  // Pick variant based on progress
  const variant =
    percentPaid >= 75
      ? 'success'
      : percentPaid >= 40
        ? 'warning'
        : 'default';

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Debt Progress</h2>

      <div className="flex flex-col items-center gap-4">
        <ProgressRing
          value={Math.round(percentPaid)}
          max={100}
          size={140}
          strokeWidth={10}
          variant={variant}
          label="Paid Off"
          aria-label={`${Math.round(percentPaid)}% of total debt paid off`}
        />

        <div className="w-full space-y-2 text-center">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Paid off</span>
            <span className="font-medium text-success">
              {formatCurrency(amountPaid)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium text-foreground">
              {formatCurrency(totalCurrent)}
            </span>
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original debt</span>
              <span className="font-medium text-muted-foreground">
                {formatCurrency(totalOriginal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
