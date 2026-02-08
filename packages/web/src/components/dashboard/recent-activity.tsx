'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Send,
  Inbox,
  DollarSign,
  FileWarning,
  Gavel,
  Handshake,
  FileCheck,
  StickyNote,
  MoreHorizontal,
  ArrowRight,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityType } from '@vindicate/shared';
import { ACTIVITY_TYPE_CONFIG } from '@vindicate/shared';
import { Timeline } from '@/components/ui/timeline';
import { EmptyState } from '@/components/ui/empty-state';
import { useActivities } from '@/hooks/use-activities';
import { useAccounts } from '@/hooks/use-accounts';
import { formatRelativeDate } from '@/lib/utils/format-date';

const ICON_MAP: Record<ActivityType, LucideIcon> = {
  'phone-call': Phone,
  'letter-received': Mail,
  'letter-sent': Send,
  'email-received': Inbox,
  'email-sent': Send,
  'payment-made': DollarSign,
  'payment-received': DollarSign,
  'dispute-filed': FileWarning,
  'court-filing': Gavel,
  'settlement-offer': Handshake,
  'credit-report-update': FileCheck,
  'note': StickyNote,
  'other': MoreHorizontal,
};

export function RecentActivity() {
  const { getRecentActivities } = useActivities();
  const { getAccount } = useAccounts();

  const recentActivities = getRecentActivities(10);

  const timelineItems = useMemo(
    () =>
      recentActivities.map(activity => {
        const account = getAccount(activity.accountId);
        const config = ACTIVITY_TYPE_CONFIG[activity.type];
        const IconComponent = ICON_MAP[activity.type] ?? MoreHorizontal;

        return {
          id: activity.id,
          icon: IconComponent,
          iconColor: config.color,
          date: formatRelativeDate(activity.date),
          title: activity.title,
          description: account?.creditorName,
          content: activity.accountId ? (
            <Link
              href={`/accounts/${activity.accountId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              aria-label={`View ${account?.creditorName ?? 'account'} details`}
            >
              View account
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          ) : undefined,
        };
      }),
    [recentActivities, getAccount]
  );

  if (recentActivities.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Activities will appear here as you log calls, payments, and correspondence."
          actionLabel="Log Activity"
          actionHref="/activity/log"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        <Link
          href="/activity"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <Timeline items={timelineItems} />
    </div>
  );
}
