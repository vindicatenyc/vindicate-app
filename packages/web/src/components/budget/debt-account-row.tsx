'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { DebtAccountInfo } from '@/lib/utils/debt-calculator';

interface DebtAccountRowProps {
  account: DebtAccountInfo;
  originalBalance?: number;
  className?: string;
}

export function DebtAccountRow({
  account,
  originalBalance,
  className,
}: DebtAccountRowProps) {
  const paid = originalBalance ? originalBalance - account.balance : 0;
  const progressPercent = originalBalance && originalBalance > 0
    ? (paid / originalBalance) * 100
    : 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        account.isFocus
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {account.isFocus && (
            <Star className="h-4 w-4 fill-primary text-primary" aria-label="Focus account" />
          )}
          <div>
            <p className={cn(
              'text-sm font-medium',
              account.isFocus ? 'text-primary' : 'text-foreground'
            )}>
              {account.name}
            </p>
            {account.isFocus && (
              <p className="text-xs text-primary/70">Pay extra on this one</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(account.balance)}
          </p>
          <p className="text-xs text-muted-foreground">balance</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Interest Rate</span>
          <p className="font-medium text-foreground">
            {account.interestRate > 0 ? `${account.interestRate}%` : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Min Payment</span>
          <p className="font-medium text-foreground">
            {formatCurrency(account.minimumPayment)}/mo
          </p>
        </div>
      </div>

      {originalBalance && originalBalance > 0 && (
        <div className="mt-3">
          <ProgressBar
            value={progressPercent}
            max={100}
            variant={progressPercent >= 100 ? 'success' : 'default'}
            size="sm"
            showPercentage={false}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(paid)} of {formatCurrency(originalBalance)} paid
          </p>
        </div>
      )}
    </div>
  );
}
