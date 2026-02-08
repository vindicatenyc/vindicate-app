import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { URGENCY_CONFIG } from '@vindicate/shared';

export interface CountdownBadgeProps {
  deadline: string;
  label?: string;
  className?: string;
}

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  const target = new Date(deadline);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgency(days: number) {
  if (days <= URGENCY_CONFIG.urgent.daysThreshold)
    return URGENCY_CONFIG.urgent;
  if (days <= URGENCY_CONFIG.caution.daysThreshold)
    return URGENCY_CONFIG.caution;
  return URGENCY_CONFIG.safe;
}

export function CountdownBadge({
  deadline,
  label = 'Deadline',
  className,
}: CountdownBadgeProps) {
  const days = getDaysRemaining(deadline);
  const urgency = getUrgency(days);

  const displayText =
    days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? 'Today'
        : days === 1
          ? '1 day left'
          : `${days} days left`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        urgency.color,
        urgency.bgColor,
        days < 0 && 'bg-danger/15 text-danger',
        className
      )}
      title={`${label}: ${new Date(deadline).toLocaleDateString()}`}
    >
      <Clock className="h-3 w-3" aria-hidden="true" />
      <span>{displayText}</span>
    </span>
  );
}
