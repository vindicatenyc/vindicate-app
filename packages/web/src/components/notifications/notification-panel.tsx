'use client';

import { useMemo } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import type { Notification } from '@vindicate/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { NotificationItem } from './notification-item';

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
}

function groupNotifications(notifications: Notification[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);

  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const n of sorted) {
    const created = new Date(n.createdAt);
    if (created >= todayStart) {
      today.push(n);
    } else if (created >= weekAgo) {
      thisWeek.push(n);
    } else {
      earlier.push(n);
    }
  }

  return { today, thisWeek, earlier };
}

function NotificationGroup({
  label,
  notifications,
  onMarkAsRead,
  onDismiss,
}: {
  label: string;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div>
      <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <div className="space-y-0.5">
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onMarkAsRead={onMarkAsRead}
            onDismiss={onDismiss}
            compact
          />
        ))}
      </div>
    </div>
  );
}

export function NotificationPanel({
  notifications,
  unreadCount,
  isOpen,
  onOpenChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: NotificationPanelProps) {
  const groups = useMemo(() => groupNotifications(notifications), [notifications]);

  const hasNotifications = notifications.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base">Notifications</SheetTitle>
              <SheetDescription className="text-xs">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={onMarkAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {hasNotifications ? (
            <div className="space-y-4 p-2">
              <NotificationGroup
                label="Today"
                notifications={groups.today}
                onMarkAsRead={onMarkAsRead}
                onDismiss={onDismiss}
              />
              <NotificationGroup
                label="This Week"
                notifications={groups.thisWeek}
                onMarkAsRead={onMarkAsRead}
                onDismiss={onDismiss}
              />
              <NotificationGroup
                label="Earlier"
                notifications={groups.earlier}
                onMarkAsRead={onMarkAsRead}
                onDismiss={onDismiss}
              />
            </div>
          ) : (
            <div className="px-4 py-12">
              <EmptyState
                icon={Bell}
                title="All caught up!"
                description="You have no notifications. We'll alert you about deadlines and updates."
              />
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
