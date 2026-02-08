'use client';

import {
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreditFactor, FactorImpact, FactorStatus } from '@vindicate/shared';

interface CreditFactorsProps {
  factors: CreditFactor[];
  className?: string;
}

const IMPACT_LABELS: Record<FactorImpact, { label: string; className: string }> = {
  high: { label: 'High Impact', className: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  medium: { label: 'Medium Impact', className: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  low: { label: 'Low Impact', className: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
};

function StatusIcon({ status }: { status: FactorStatus }) {
  switch (status) {
    case 'positive':
      return <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Positive factor" />;
    case 'negative':
      return <AlertTriangle className="h-4 w-4 text-red-600" aria-label="Negative factor" />;
    case 'neutral':
      return <Circle className="h-4 w-4 text-gray-400" aria-label="Neutral factor" />;
  }
}

export function CreditFactors({ factors, className }: CreditFactorsProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-soft',
        className
      )}
    >
      <h3 className="text-sm font-medium text-muted-foreground">
        Score Factors
      </h3>

      <div className="mt-4 space-y-3">
        {factors.map(factor => {
          const impact = IMPACT_LABELS[factor.impact];
          return (
            <div
              key={factor.name}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusIcon status={factor.status} />
                  <span className="text-sm font-medium text-foreground">
                    {factor.name}
                  </span>
                </div>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  impact.className
                )}>
                  {impact.label}
                </span>
              </div>
              <p className="mt-1.5 ml-6 text-xs leading-relaxed text-muted-foreground">
                {factor.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
