'use client';

import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import type { StatusChange } from '@vindicate/shared';
import { ACCOUNT_STATUS_CONFIG } from '@vindicate/shared';
import { Timeline } from '@/components/ui/timeline';

interface StatusTimelineProps {
  statusHistory: StatusChange[];
  className?: string;
}

export function StatusTimeline({ statusHistory, className }: StatusTimelineProps) {
  const timelineItems = useMemo(
    () =>
      [...statusHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((change, idx) => {
          const fromConfig = ACCOUNT_STATUS_CONFIG[change.from];
          const toConfig = ACCOUNT_STATUS_CONFIG[change.to];

          return {
            id: `status-change-${idx}`,
            icon: ArrowRight,
            iconColor: toConfig.color,
            date: new Date(change.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            title: `${fromConfig.label} → ${toConfig.label}`,
            description: change.reason,
          };
        }),
    [statusHistory]
  );

  if (statusHistory.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No status changes recorded.
      </p>
    );
  }

  return <Timeline items={timelineItems} className={className} />;
}
