'use client';

/**
 * Custom hook for managing notifications
 * Provides access to notification state and actions
 */

import { useState, useCallback, useMemo } from 'react';
import type { Notification, NotificationType, NotificationPriority } from '@vindicate/shared';
import { mockNotifications as initialNotifications } from '@/lib/mock-data';

export type NewNotification = Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>;

function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new notification
  const addNotification = useCallback((notification: NewNotification): Notification => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);
    return newNotification;
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id: string): void => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback((): void => {
    const now = new Date().toISOString();
    setNotifications(prev =>
      prev.map(notification =>
        !notification.isRead
          ? { ...notification, isRead: true, readAt: now }
          : notification
      )
    );
  }, []);

  // Dismiss a notification
  const dismiss = useCallback((id: string): void => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isDismissed: true }
          : notification
      )
    );
  }, []);

  // Dismiss all notifications
  const dismissAll = useCallback((): void => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isDismissed: true }))
    );
  }, []);

  // Delete a notification permanently
  const deleteNotification = useCallback((id: string): void => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Get unread notifications
  const getUnread = useCallback((): Notification[] => {
    return notifications.filter(n => !n.isRead && !n.isDismissed);
  }, [notifications]);

  // Get notifications by type
  const getByType = useCallback((type: NotificationType): Notification[] => {
    return notifications.filter(n => n.type === type && !n.isDismissed);
  }, [notifications]);

  // Get notifications by priority
  const getByPriority = useCallback((priority: NotificationPriority): Notification[] => {
    return notifications.filter(n => n.priority === priority && !n.isDismissed);
  }, [notifications]);

  // Get notifications for an account
  const getForAccount = useCallback((accountId: string): Notification[] => {
    return notifications.filter(n => n.accountId === accountId && !n.isDismissed);
  }, [notifications]);

  // Get notifications for a case
  const getForCase = useCallback((caseId: string): Notification[] => {
    return notifications.filter(n => n.caseId === caseId && !n.isDismissed);
  }, [notifications]);

  // Get recent notifications
  const getRecent = useCallback((limit: number = 10): Notification[] => {
    return [...notifications]
      .filter(n => !n.isDismissed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [notifications]);

  // Get high-priority unread notifications
  const getUrgent = useCallback((): Notification[] => {
    return notifications.filter(
      n => !n.isRead && !n.isDismissed && ['high', 'urgent'].includes(n.priority)
    );
  }, [notifications]);

  // Computed values
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead && !n.isDismissed).length,
    [notifications]
  );

  const urgentCount = useMemo(
    () => notifications.filter(
      n => !n.isRead && !n.isDismissed && ['high', 'urgent'].includes(n.priority)
    ).length,
    [notifications]
  );

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: unreadCount,
    urgent: urgentCount,
    byType: notifications.reduce((acc, n) => {
      if (!n.isDismissed) {
        acc[n.type] = (acc[n.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<NotificationType, number>),
  }), [notifications, unreadCount, urgentCount]);

  return {
    notifications: notifications.filter(n => !n.isDismissed),
    isLoading,
    error,
    unreadCount,
    urgentCount,
    stats,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    deleteNotification,
    getUnread,
    getByType,
    getByPriority,
    getForAccount,
    getForCase,
    getRecent,
    getUrgent,
  };
}
