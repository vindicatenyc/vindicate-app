'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import type { CaseReminder } from '@vindicate/shared';
import { UrgencyIndicator } from '@/components/ui/urgency-indicator';
import { cn } from '@/lib/utils';

interface CaseDeadlinesProps {
  reminders: CaseReminder[];
  responseDeadline?: string;
  hearingDate?: string;
  onCompleteReminder?: (reminderId: string) => void;
  className?: string;
}

interface DeadlineEntry {
  id: string;
  title: string;
  date: string;
  isCompleted: boolean;
  notes?: string;
  isSystemDeadline?: boolean;
}

export function CaseDeadlines({
  reminders,
  responseDeadline,
  hearingDate,
  onCompleteReminder,
  className,
}: CaseDeadlinesProps) {
  const entries: DeadlineEntry[] = [];

  if (responseDeadline) {
    entries.push({
      id: 'sys-response-deadline',
      title: 'Response Deadline',
      date: responseDeadline,
      isCompleted: false,
      isSystemDeadline: true,
    });
  }

  if (hearingDate) {
    entries.push({
      id: 'sys-hearing-date',
      title: 'Hearing Date',
      date: hearingDate,
      isCompleted: false,
      isSystemDeadline: true,
    });
  }

  for (const reminder of reminders) {
    entries.push({
      id: reminder.id,
      title: reminder.title,
      date: reminder.date,
      isCompleted: reminder.isCompleted,
      notes: reminder.notes,
    });
  }

  // Sort by date, soonest first (incomplete first, then completed)
  entries.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  if (entries.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        No deadlines or reminders set.
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {entries.map(entry => (
        <div
          key={entry.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border border-border p-3 transition-colors',
            entry.isCompleted && 'opacity-60'
          )}
        >
          {!entry.isSystemDeadline && onCompleteReminder ? (
            <button
              type="button"
              onClick={() => !entry.isCompleted && onCompleteReminder(entry.id)}
              className="mt-0.5 shrink-0"
              aria-label={entry.isCompleted ? 'Completed' : 'Mark as completed'}
            >
              {entry.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
          ) : (
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={cn(
                'text-sm font-medium',
                entry.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              )}>
                {entry.title}
              </p>
              {!entry.isCompleted && <UrgencyIndicator deadline={entry.date} />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            {entry.notes && (
              <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
