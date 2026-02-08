'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityType, HarassmentDetails } from '@vindicate/shared';
import { ACTIVITY_TYPE_CONFIG } from '@vindicate/shared';
import { useActivities } from '@/hooks/use-activities';
import type { NewActivity } from '@/hooks/use-activities';
import { useAccounts } from '@/hooks/use-accounts';
import { Button } from '@/components/ui/button';
import { HarassmentChecklist, EMPTY_HARASSMENT_CHECKLIST } from './harassment-checklist';
import type { HarassmentChecklistState } from './harassment-checklist';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

const ACTIVITY_TYPE_ICON_MAP: Record<ActivityType, LucideIcon> = {
  'phone-call': Phone,
  'letter-received': Mail,
  'letter-sent': Send,
  'email-received': Inbox,
  'email-sent': Send,
  'payment-made': DollarSign,
  'payment-received': DollarSign,
  'dispute-filed': FileWarning,
  'court-filing': Gavel,
  'settlement-offer': DollarSign,
  'credit-report-update': StickyNote,
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

const DIRECTION_TYPES: ActivityType[] = [
  'phone-call',
  'letter-received',
  'letter-sent',
  'email-received',
  'email-sent',
  'settlement-offer',
];

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface FormErrors {
  accountId?: string;
  type?: string;
  title?: string;
}

export function ActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addActivity } = useActivities();
  const { accounts } = useAccounts();

  const preselectedAccountId = searchParams.get('accountId') ?? '';

  const [activityType, setActivityType] = useState<ActivityType>('phone-call');
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [accountId, setAccountId] = useState(preselectedAccountId);
  const [dateTime, setDateTime] = useState(toLocalDatetimeString(new Date()));
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [isHarassment, setIsHarassment] = useState(false);
  const [harassmentChecklist, setHarassmentChecklist] = useState<HarassmentChecklistState>(
    EMPTY_HARASSMENT_CHECKLIST
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showDirection = DIRECTION_TYPES.includes(activityType);
  const showAmount = ['payment-made', 'payment-received', 'settlement-offer'].includes(activityType);
  const showPhone = activityType === 'phone-call';

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!accountId) newErrors.accountId = 'Please select an account';
    if (!activityType) newErrors.type = 'Please select an activity type';
    if (!title.trim()) newErrors.title = 'Please enter a title';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [accountId, activityType, title]);

  const buildHarassmentDetails = (): HarassmentDetails => {
    const details: HarassmentDetails = {};
    if (harassmentChecklist.calledBeforeEight) details.timeOfCall = 'Before 8am';
    if (harassmentChecklist.calledAfterNine) details.timeOfCall = 'After 9pm';
    if (harassmentChecklist.threatenedViolence || harassmentChecklist.threatenedArrest)
      details.threatsOfViolence = true;
    if (harassmentChecklist.usedProfanity) details.obsceneLanguage = true;
    if (harassmentChecklist.repeatedCalls) details.repeatedCalls = true;
    if (harassmentChecklist.calledWorkplace) details.calledWorkplace = true;
    if (harassmentChecklist.disclosedToThirdParty) details.disclosedToThirdParty = true;
    if (harassmentChecklist.falseRepresentation) details.falseRepresentation = true;
    if (harassmentChecklist.otherViolation) details.otherViolation = harassmentChecklist.otherViolation;
    return details;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const isoDate = new Date(dateTime).toISOString();

    const newActivity: NewActivity = {
      accountId,
      type: activityType,
      direction: showDirection ? direction : undefined,
      date: isoDate,
      title: title.trim(),
      notes: notes.trim() || undefined,
      amount: showAmount && amount ? parseFloat(amount) : undefined,
      callerPhone: showPhone && callerPhone ? callerPhone : undefined,
      isHarassment,
      harassmentDetails: isHarassment ? buildHarassmentDetails() : undefined,
    };

    addActivity(newActivity);
    router.push('/activity');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Activity Type Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Activity Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {ACTIVITY_TYPE_OPTIONS.map(type => {
            const config = ACTIVITY_TYPE_CONFIG[type];
            const Icon = ACTIVITY_TYPE_ICON_MAP[type];
            const isSelected = activityType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActivityType(type)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-foreground hover:border-primary/30'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-primary' : config.color)} />
                <span className="truncate">{config.label}</span>
              </button>
            );
          })}
        </div>
        {errors.type && <p className="mt-1 text-xs text-destructive">{errors.type}</p>}
      </div>

      {/* Direction toggle */}
      {showDirection && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Direction</label>
          <div className="flex gap-2">
            {(['inbound', 'outbound'] as const).map(dir => (
              <button
                key={dir}
                type="button"
                onClick={() => setDirection(dir)}
                className={cn(
                  'flex-1 rounded-lg border p-2.5 text-center text-sm transition-colors capitalize',
                  direction === dir
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-foreground hover:border-primary/30'
                )}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account Selector */}
      <div>
        <label htmlFor="accountId" className="block text-sm font-medium text-foreground mb-1">
          Account <span className="text-destructive">*</span>
        </label>
        <select
          id="accountId"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Select an account...</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.creditorName}
              {account.collectorName ? ` (via ${account.collectorName})` : ''}
            </option>
          ))}
        </select>
        {errors.accountId && <p className="mt-1 text-xs text-destructive">{errors.accountId}</p>}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Brief description of the activity..."
          className={INPUT_CLASS}
        />
        {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
      </div>

      {/* Date/Time */}
      <div>
        <label htmlFor="dateTime" className="block text-sm font-medium text-foreground mb-1">
          Date & Time
        </label>
        <input
          id="dateTime"
          type="datetime-local"
          value={dateTime}
          onChange={e => setDateTime(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {/* Conditional: Phone number */}
      {showPhone && (
        <div>
          <label htmlFor="callerPhone" className="block text-sm font-medium text-foreground mb-1">
            Phone Number
          </label>
          <input
            id="callerPhone"
            type="tel"
            value={callerPhone}
            onChange={e => setCallerPhone(e.target.value)}
            placeholder="(xxx) xxx-xxxx"
            className={INPUT_CLASS}
          />
        </div>
      )}

      {/* Conditional: Amount */}
      {showAmount && (
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
            Amount ($)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className={INPUT_CLASS}
          />
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add any details about this activity..."
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 resize-y"
        />
      </div>

      {/* Harassment Toggle */}
      <div className="rounded-lg border border-border p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isHarassment}
            onChange={e => setIsHarassment(e.target.checked)}
            className="h-4 w-4 rounded border-border text-red-600 focus:ring-red-500"
          />
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-foreground">Flag as Harassment</span>
          </div>
        </label>
        <p className="mt-1 ml-7 text-xs text-muted-foreground">
          Flag this interaction as a potential FDCPA violation
        </p>

        {isHarassment && (
          <HarassmentChecklist
            value={harassmentChecklist}
            onChange={setHarassmentChecklist}
            className="mt-3"
          />
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Log Activity'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/activity')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
