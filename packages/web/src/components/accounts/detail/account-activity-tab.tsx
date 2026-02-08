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
  Handshake,
  FileCheck,
  StickyNote,
  MoreHorizontal,
  Plus,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityType } from '@vindicate/shared';
import { ACTIVITY_TYPE_CONFIG } from '@vindicate/shared';
import { Timeline } from '@/components/ui/timeline';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useActivities } from '@/hooks/use-activities';
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

interface AccountActivityTabProps {
  accountId: string;
}

const MAX_NOTES_LENGTH = 120;

export function AccountActivityTab({ accountId }: AccountActivityTabProps) {
  const { getActivitiesForAccount } = useActivities();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const activities = useMemo(() => {
    const acts = getActivitiesForAccount(accountId);
    return [...acts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [getActivitiesForAccount, accountId]);

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const timelineItems = useMemo(
    () =>
      activities.map(activity => {
        const config = ACTIVITY_TYPE_CONFIG[activity.type];
        const IconComponent = ICON_MAP[activity.type] ?? MoreHorizontal;
        const isExpanded = expandedIds.has(activity.id);
        const hasLongNotes = (activity.notes?.length ?? 0) > MAX_NOTES_LENGTH;
        const displayNotes =
          activity.notes && hasLongNotes && !isExpanded
            ? activity.notes.slice(0, MAX_NOTES_LENGTH) + '...'
            : activity.notes;

        return {
          id: activity.id,
          icon: IconComponent,
          iconColor: config.color,
          date: formatRelativeDate(activity.date),
          title: activity.title,
          description: config.label,
          content: activity.notes ? (
            <div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayNotes}
              </p>
              {hasLongNotes && (
                <button
                  onClick={() => toggleExpanded(activity.id)}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <>
                      Show less
                      <ChevronUp className="h-3 w-3" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Show more
                      <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
            </div>
          ) : undefined,
        };
      }),
    [activities, expandedIds]
  );

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity logged yet"
        description="Start tracking calls, letters, and payments for this account."
        actionLabel="Log Activity"
        actionHref={`/activity/log?accountId=${accountId}`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activities.length} {activities.length === 1 ? 'entry' : 'entries'}
        </p>
        <Link href={`/activity/log?accountId=${accountId}`}>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Log Activity
          </Button>
        </Link>
      </div>
      <Timeline items={timelineItems} />
    </div>
  );
}
