'use client';

import {
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Trophy,
  Lightbulb,
} from 'lucide-react';
import type { NotificationPreferences } from '@vindicate/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';

interface SettingToggle {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: typeof Clock;
}

const NOTIFICATION_SETTINGS: SettingToggle[] = [
  {
    key: 'deadlines',
    label: 'Deadlines',
    description: 'Get alerts when response deadlines, court dates, or SOL dates are approaching.',
    icon: Clock,
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Reminders for upcoming payment plan installments and due dates.',
    icon: DollarSign,
  },
  {
    key: 'creditScore',
    label: 'Credit Score',
    description: 'Updates when your credit score changes or new factors are reported.',
    icon: TrendingUp,
  },
  {
    key: 'accountActivity',
    label: 'Account Activity',
    description: 'Alerts when account statuses change or new documents are received.',
    icon: RefreshCw,
  },
  {
    key: 'budgetAlerts',
    label: 'Budget Alerts',
    description: 'Notifications when spending exceeds category limits or income changes.',
    icon: AlertTriangle,
  },
  {
    key: 'milestones',
    label: 'Milestones',
    description: 'Celebrate wins like settling a debt, completing payments, or score improvements.',
    icon: Trophy,
  },
  {
    key: 'vinnyTips',
    label: 'Vinny Tips',
    description: 'Contextual tips and suggestions from your AI companion Vinny.',
    icon: Lightbulb,
  },
];

export function NotificationSettings() {
  const notificationPreferences = useAppStore((s) => s.notificationPreferences);
  const updateNotificationPreference = useAppStore((s) => s.updateNotificationPreference);
  const resetNotificationPreferences = useAppStore((s) => s.resetNotificationPreferences);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card">
        {NOTIFICATION_SETTINGS.map((setting, index) => {
          const Icon = setting.icon;
          const enabled = notificationPreferences[setting.key];

          return (
            <div
              key={setting.key}
              className={cn(
                'flex items-center gap-4 px-5 py-4',
                index < NOTIFICATION_SETTINGS.length - 1 && 'border-b border-border'
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{setting.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{setting.description}</p>
              </div>
              <button
                role="switch"
                aria-checked={enabled}
                aria-label={`${setting.label} notifications`}
                onClick={() => updateNotificationPreference(setting.key, !enabled)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  enabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform',
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={resetNotificationPreferences}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
