import { cn } from '@/lib/utils';

interface UrgencyIndicatorProps {
  deadline: string;
  className?: string;
}

function getDaysUntil(deadline: string): number {
  const now = new Date();
  const target = new Date(deadline);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function UrgencyIndicator({ deadline, className }: UrgencyIndicatorProps) {
  const days = getDaysUntil(deadline);

  let colorClasses: string;
  let text: string;
  let pulse = false;

  if (days < 0) {
    colorClasses = 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/50';
    text = `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
    pulse = true;
  } else if (days === 0) {
    colorClasses = 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/50';
    text = 'Due today';
    pulse = true;
  } else if (days <= 7) {
    colorClasses = 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/40';
    text = `${days} day${days === 1 ? '' : 's'}`;
  } else if (days <= 14) {
    colorClasses = 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40';
    text = `${days} days`;
  } else {
    colorClasses = 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/40';
    text = `${days} days`;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colorClasses,
        pulse && 'animate-pulse',
        className
      )}
    >
      {text}
    </span>
  );
}
