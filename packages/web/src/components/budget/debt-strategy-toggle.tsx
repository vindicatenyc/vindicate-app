'use client';

import { Snowflake, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DebtStrategy } from '@/lib/utils/debt-calculator';

interface DebtStrategyToggleProps {
  strategy: DebtStrategy;
  onChange: (strategy: DebtStrategy) => void;
  className?: string;
}

export function DebtStrategyToggle({
  strategy,
  onChange,
  className,
}: DebtStrategyToggleProps) {
  return (
    <div
      className={cn('inline-flex rounded-lg border border-border bg-muted p-1', className)}
      role="radiogroup"
      aria-label="Debt repayment strategy"
    >
      <button
        role="radio"
        aria-checked={strategy === 'snowball'}
        onClick={() => onChange('snowball')}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          strategy === 'snowball'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Snowflake className="h-4 w-4" aria-hidden="true" />
        Snowball
      </button>
      <button
        role="radio"
        aria-checked={strategy === 'avalanche'}
        onClick={() => onChange('avalanche')}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          strategy === 'avalanche'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <TrendingUp className="h-4 w-4" aria-hidden="true" />
        Avalanche
      </button>
    </div>
  );
}
