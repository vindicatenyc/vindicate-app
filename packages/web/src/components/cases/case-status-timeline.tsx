'use client';

import { Check } from 'lucide-react';
import type { VindicateCaseStatus, CaseType } from '@vindicate/shared';
import { CASE_STATUS_CONFIG } from '@vindicate/shared';
import { cn } from '@/lib/utils';

const CASE_TYPE_STEPS: Record<CaseType, VindicateCaseStatus[]> = {
  'credit-bureau-dispute': ['draft', 'filed', 'under-review', 'response-received', 'resolved'],
  'debt-validation': ['draft', 'filed', 'under-review', 'response-received', 'resolved'],
  'fdcpa-complaint': ['draft', 'filed', 'under-review', 'response-received', 'hearing-scheduled', 'resolved'],
  'lawsuit-defendant': ['draft', 'filed', 'response-received', 'hearing-scheduled', 'in-progress', 'resolved'],
  'lawsuit-plaintiff': ['draft', 'filed', 'under-review', 'hearing-scheduled', 'in-progress', 'resolved'],
  'arbitration': ['draft', 'filed', 'under-review', 'hearing-scheduled', 'resolved'],
  'cfpb-complaint': ['draft', 'filed', 'under-review', 'response-received', 'resolved'],
  'other': ['draft', 'filed', 'in-progress', 'resolved'],
};

interface CaseStatusTimelineProps {
  caseType: CaseType;
  currentStatus: VindicateCaseStatus;
  className?: string;
}

export function CaseStatusTimeline({ caseType, currentStatus, className }: CaseStatusTimelineProps) {
  const steps = CASE_TYPE_STEPS[caseType] ?? CASE_TYPE_STEPS.other;

  // Handle terminal statuses
  if (currentStatus === 'escalated' || currentStatus === 'closed') {
    const config = CASE_STATUS_CONFIG[currentStatus];
    return (
      <div className={cn('flex items-center justify-center py-3', className)}>
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', config.color, config.bgColor)}>
          {config.label}
        </span>
      </div>
    );
  }

  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-center">
        {steps.map((step, index) => {
          const config = CASE_STATUS_CONFIG[step];
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    !isCompleted && !isCurrent && 'border-muted-foreground/30 bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-[10px] font-medium text-center max-w-[80px] leading-tight',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {config.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1.5 mt-[-18px]',
                    isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical compact */}
      <div className="sm:hidden flex flex-wrap gap-1.5">
        {steps.map((step, index) => {
          const config = CASE_STATUS_CONFIG[step];
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                isCompleted && 'bg-primary/10 text-primary',
                isCurrent && 'bg-primary text-primary-foreground',
                !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted && <Check className="h-3 w-3" />}
              {config.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
