'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationPanel } from './notification-panel';

export function NotificationBell() {
  const [panelOpen, setPanelOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();

  return (
    <>
      <button
        onClick={() => setPanelOpen(true)}
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-md',
          'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        notifications={notifications}
        unreadCount={unreadCount}
        isOpen={panelOpen}
        onOpenChange={setPanelOpen}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDismiss={dismiss}
      />
    </>
  );
}
