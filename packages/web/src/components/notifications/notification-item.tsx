'use client';

import { useRouter } from 'next/navigation';
import {
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Trophy,
  Lightbulb,
  Info,
  Check,
  X,
} from 'lucide-react';
import type { Notification, NotificationType } from '@vindicate/shared';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<NotificationType, typeof Clock> = {
  'deadline-approaching': Clock,
  'payment-due': DollarSign,
  'credit-score-change': TrendingUp,
  'account-status-change': RefreshCw,
  'budget-alert': AlertTriangle,
  'milestone-reached': Trophy,
  'vinny-tip': Lightbulb,
  'system': Info,
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter();
  const Icon = ICON_MAP[notification.type];
  const isUrgent = notification.priority === 'urgent' || notification.priority === 'high';

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded-lg border border-transparent transition-colors',
        compact ? 'px-3 py-2.5' : 'px-4 py-3',
        !notification.isRead && 'bg-primary/5',
        notification.actionUrl && 'cursor-pointer hover:bg-muted/50',
        isUrgent && !notification.isRead && 'border-l-2 border-l-danger'
      )}
      onClick={handleClick}
      role={notification.actionUrl ? 'button' : undefined}
      tabIndex={notification.actionUrl ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full',
          compact ? 'h-8 w-8' : 'h-9 w-9',
          isUrgent ? 'bg-danger/10 text-danger' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug',
              !notification.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        {!compact && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        )}
        {notification.actionLabel && !compact && (
          <span className="mt-1 inline-block text-xs font-medium text-primary">
            {notification.actionLabel}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.isRead && onMarkAsRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notification.id);
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2">
          <span className="block h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
