'use client';

import { CheckCircle2, Target, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { SavingsGoal } from '@vindicate/shared';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
  className?: string;
}

function calculateTargetDate(goal: SavingsGoal): string | null {
  if (goal.currentAmount >= goal.targetAmount) return null;
  if (goal.monthlyContribution <= 0) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthsNeeded);

  return targetDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function SavingsGoalCard({
  goal,
  onEdit,
  onDelete,
  className,
}: SavingsGoalCardProps) {
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const percentage = goal.targetAmount > 0
    ? (goal.currentAmount / goal.targetAmount) * 100
    : 0;
  const estimatedDate = calculateTargetDate(goal);

  return (
    <div
      className={cn(
        'group rounded-xl border p-4 transition-colors',
        isComplete
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
          : 'border-border bg-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Goal reached" />
          ) : (
            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{goal.name}</p>
            {isComplete && (
              <p className="text-xs text-green-600 font-medium">Goal reached!</p>
            )}
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(goal)}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${goal.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="rounded p-1 text-muted-foreground hover:text-red-600"
            aria-label={`Delete ${goal.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-foreground">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="text-muted-foreground">
            of {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <ProgressBar
          value={goal.currentAmount}
          max={goal.targetAmount}
          variant={isComplete ? 'success' : 'default'}
          size="sm"
          showPercentage={false}
          className="mt-2"
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatCurrency(goal.monthlyContribution)}/mo contribution
        </span>
        {estimatedDate && (
          <span>Target: {estimatedDate}</span>
        )}
        {goal.targetDate && !estimatedDate && !isComplete && (
          <span>
            Target: {new Date(goal.targetDate).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
