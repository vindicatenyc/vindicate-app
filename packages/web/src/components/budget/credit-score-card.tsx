'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/progress-ring';
import { CREDIT_RATING_CONFIG } from '@vindicate/shared';
import type { CreditRating } from '@vindicate/shared';

interface CreditScoreCardProps {
  score: number;
  rating: CreditRating;
  className?: string;
}

function getVariant(rating: CreditRating): 'success' | 'warning' | 'danger' | 'default' {
  switch (rating) {
    case 'excellent':
    case 'very-good':
      return 'success';
    case 'good':
      return 'warning';
    case 'fair':
    case 'poor':
      return 'danger';
    default:
      return 'default';
  }
}

export function CreditScoreCard({
  score,
  rating,
  className,
}: CreditScoreCardProps) {
  const config = CREDIT_RATING_CONFIG[rating];
  const variant = getVariant(rating);

  // Normalize score to 0-100 for the ring (300-850 range)
  const normalizedValue = ((score - 300) / (850 - 300)) * 100;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-soft',
        className
      )}
    >
      <h3 className="text-sm font-medium text-muted-foreground">
        Credit Score
      </h3>

      <div className="mt-4 flex flex-col items-center">
        <div className="relative">
          <ProgressRing
            value={normalizedValue}
            max={100}
            size={140}
            strokeWidth={10}
            variant={variant}
            showValue={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{score}</span>
            <span className={cn('text-sm font-medium', config.color)}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Score range indicator */}
        <div className="mt-4 flex w-full items-center justify-between text-[10px] text-muted-foreground">
          <span>300</span>
          <div className="mx-2 flex h-1.5 flex-1 overflow-hidden rounded-full">
            <div className="flex-1 bg-red-400" />
            <div className="flex-1 bg-orange-400" />
            <div className="flex-1 bg-yellow-400" />
            <div className="flex-1 bg-green-400" />
            <div className="flex-1 bg-green-600" />
          </div>
          <span>850</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Simulated score for educational purposes only. Your actual credit score may differ.
        </p>
      </div>
    </div>
  );
}
