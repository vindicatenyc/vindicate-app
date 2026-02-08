'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Send,
  Inbox,
  DollarSign,
  FileWarning,
  Gavel,
  StickyNote,
  MoreHorizontal,
  FileCheck,
  Handshake,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity as ActivityIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityType } from '@vindicate/shared';
import { ACTIVITY_TYPE_CONFIG } from '@vindicate/shared';
import { useActivities } from '@/hooks/use-activities';
import type { ActivityFilters } from '@/hooks/use-activities';
import { useAccounts } from '@/hooks/use-accounts';
import { Timeline } from '@/components/ui/timeline';
import type { TimelineItem } from '@/components/ui/timeline';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate, formatCurrency } from '@/lib/utils/format-date';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

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

const ACTIVITY_TYPE_OPTIONS: ActivityType[] = [
  'phone-call',
  'letter-received',
  'letter-sent',
  'email-received',
  'email-sent',
  'payment-made',
  'payment-received',
  'dispute-filed',
  'court-filing',
  'settlement-offer',
  'credit-report-update',
  'note',
  'other',
];

interface ActivityTimelineProps {
  className?: string;
}

function ExpandableNotes({ notes }: { notes: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = notes.length > 120;

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {isLong && !expanded ? `${notes.slice(0, 120)}...` : notes}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-0.5 flex items-center gap-0.5 text-xs text-primary hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Show more
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function ActivityTimeline({ className }: ActivityTimelineProps) {
  const { getFilteredActivities } = useActivities();
  const { accounts } = useAccounts();

  const [search, setSearch] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterTypes, setFilterTypes] = useState<ActivityType[]>([]);

  const filters = useMemo<ActivityFilters>(() => ({
    accountId: filterAccountId || undefined,
    type: filterTypes.length > 0 ? filterTypes : undefined,
    search: search || undefined,
  }), [filterAccountId, filterTypes, search]);

  const filteredActivities = useMemo(
    () => getFilteredActivities(filters, { field: 'date', direction: 'desc' }),
    [getFilteredActivities, filters]
  );

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of accounts) {
      map.set(acc.id, acc.creditorName);
    }
    return map;
  }, [accounts]);

  const toggleTypeFilter = (type: ActivityType) => {
    setFilterTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const timelineItems: TimelineItem[] = filteredActivities.map(activity => {
    const config = ACTIVITY_TYPE_CONFIG[activity.type];
    const Icon = ICON_MAP[activity.type];
    const accountName = accountMap.get(activity.accountId) ?? 'Unknown Account';

    return {
      id: activity.id,
      icon: Icon,
      iconColor: config.color,
      date: formatRelativeDate(activity.date),
      title: activity.title,
      content: (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/accounts/${activity.accountId}`}
              className="inline-flex"
            >
              <Badge variant="outline" className="text-xs hover:bg-primary/10 cursor-pointer">
                {accountName}
              </Badge>
            </Link>
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
            {activity.direction && (
              <Badge variant="secondary" className="text-xs capitalize">
                {activity.direction}
              </Badge>
            )}
            {activity.isHarassment && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="mr-0.5 h-3 w-3" />
                Harassment
              </Badge>
            )}
            {activity.amount != null && (
              <Badge variant="secondary" className="text-xs">
                {formatCurrency(activity.amount)}
              </Badge>
            )}
          </div>
          {activity.notes && <ExpandableNotes notes={activity.notes} />}
        </div>
      ),
    };
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search activities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(INPUT_CLASS, 'pl-9')}
            aria-label="Search activities"
          />
        </div>
        <select
          value={filterAccountId}
          onChange={e => setFilterAccountId(e.target.value)}
          className={cn(INPUT_CLASS, 'max-w-xs')}
          aria-label="Filter by account"
        >
          <option value="">All Accounts</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.creditorName}
            </option>
          ))}
        </select>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {ACTIVITY_TYPE_OPTIONS.map(type => {
          const config = ACTIVITY_TYPE_CONFIG[type];
          const isActive = filterTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleTypeFilter(type)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {config.label}
            </button>
          );
        })}
        {filterTypes.length > 0 && (
          <button
            type="button"
            onClick={() => setFilterTypes([])}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
      </p>

      {/* Timeline */}
      {timelineItems.length > 0 ? (
        <Timeline items={timelineItems} />
      ) : (
        <EmptyState
          icon={ActivityIcon}
          title="No activities found"
          description="Try adjusting your filters, or log your first activity."
          actionLabel="Log Activity"
          actionHref="/activity/log"
        />
      )}
    </div>
  );
}
