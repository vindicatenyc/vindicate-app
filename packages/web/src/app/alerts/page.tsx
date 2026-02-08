'use client';

import { useState, useMemo } from 'react';
import { Settings, Filter } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import type { NotificationType } from '@vindicate/shared';
import { NOTIFICATION_TYPE_CONFIG } from '@vindicate/shared';

type FilterMode = 'all' | 'unread' | 'read';
type TypeFilter = NotificationType | 'all';

export default function AlertsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    if (filterMode === 'unread') {
      result = result.filter((n) => !n.isRead);
    } else if (filterMode === 'read') {
      result = result.filter((n) => n.isRead);
    }

    if (typeFilter !== 'all') {
      result = result.filter((n) => n.type === typeFilter);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filterMode, typeFilter]);

  const notificationTypes = useMemo(() => {
    const types = new Set(notifications.map((n) => n.type));
    return Array.from(types);
  }, [notifications]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Stay on top of deadlines, payments, and updates."
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            <Link href="/alerts/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-1.5 h-4 w-4" />
                Preferences
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="space-y-3">
        {/* Read/Unread filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div className="flex gap-1">
            {(['all', 'unread', 'read'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  filterMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {mode === 'all' ? 'All' : mode === 'unread' ? `Unread (${unreadCount})` : 'Read'}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTypeFilter('all')}
          >
            All Types
          </Badge>
          {notificationTypes.map((type) => (
            <Badge
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTypeFilter(type)}
            >
              {NOTIFICATION_TYPE_CONFIG[type].label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Notification list */}
      {filteredNotifications.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {filteredNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkAsRead={markAsRead}
                onDismiss={dismiss}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description={
            filterMode !== 'all' || typeFilter !== 'all'
              ? 'No notifications match your current filters.'
              : 'You have no notifications. We\'ll alert you about upcoming deadlines and important updates.'
          }
        />
      )}
    </div>
  );
}
