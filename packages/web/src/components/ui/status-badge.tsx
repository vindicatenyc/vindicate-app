import { cn } from '@/lib/utils';
import {
  ACCOUNT_STATUS_CONFIG,
  CASE_STATUS_CONFIG,
} from '@vindicate/shared';
import type { AccountStatus, VindicateCaseStatus } from '@vindicate/shared';

export interface StatusBadgeProps {
  status: AccountStatus | VindicateCaseStatus;
  type?: 'account' | 'case';
  className?: string;
}

export function StatusBadge({
  status,
  type = 'account',
  className,
}: StatusBadgeProps) {
  const config =
    type === 'account'
      ? ACCOUNT_STATUS_CONFIG[status as AccountStatus]
      : CASE_STATUS_CONFIG[status as VindicateCaseStatus];

  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.color,
        config.bgColor,
        className
      )}
      title={config.description}
    >
      {config.label}
    </span>
  );
}
