'use client';

import Link from 'next/link';
import {
  CreditCard,
  Heart,
  GraduationCap,
  Car,
  Wallet,
  Zap,
  Home,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Account, AccountCategory } from '@vindicate/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format-date';
import { cn } from '@/lib/utils';

const CATEGORY_ICON_MAP: Record<AccountCategory, LucideIcon> = {
  'credit-card': CreditCard,
  'medical': Heart,
  'student-loan': GraduationCap,
  'auto-loan': Car,
  'personal-loan': Wallet,
  'utility': Zap,
  'rent': Home,
  'tax': FileText,
  'other': MoreHorizontal,
};

interface AccountCardProps {
  account: Account;
  className?: string;
}

export function AccountCard({ account, className }: AccountCardProps) {
  const CategoryIcon = account.category
    ? CATEGORY_ICON_MAP[account.category]
    : MoreHorizontal;

  return (
    <Link
      href={`/accounts/${account.id}`}
      className={cn(
        'group block rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
      aria-label={`View ${account.creditorName} account details`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CategoryIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {account.creditorName}
            </h3>
            {account.collectorName && (
              <p className="truncate text-xs text-muted-foreground">
                via {account.collectorName}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={account.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(account.currentBalance)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Original</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(account.originalBalance)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          Last activity {formatRelativeDate(account.dateOfLastActivity)}
        </span>
      </div>
    </Link>
  );
}
