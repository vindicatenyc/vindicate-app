'use client';

/**
 * Custom hook for managing notifications — backed by Supabase
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Notification, NotificationType, NotificationPriority } from '@vindicate/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { notificationFromRow, notificationToRow } from '@/lib/supabase/mappers';

export type NewNotification = Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>;

export function useNotifications() {
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setNotifications((data ?? []).map(notificationFromRow));
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addNotification = useCallback(async (notification: NewNotification): Promise<Notification | null> => {
    if (!user) return null;
    const row = {
      ...notificationToRow(notification),
      user_id: user.id,
      is_read: false,
      is_dismissed: false,
    };
    const { data, error: insertError } = await supabase
      .from('notifications')
      .insert(row)
      .select()
      .single();
    if (insertError) { setError(insertError.message); return null; }
    const n = notificationFromRow(data);
    setNotifications(prev => [n, ...prev]);
    return n;
  }, [user, supabase]);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    await supabase.from('notifications').update({ is_read: true, read_at: now }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: now } : n));
  }, [supabase]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from('notifications').update({ is_read: true, read_at: now }).eq('is_read', false);
    setNotifications(prev => prev.map(n => !n.isRead ? { ...n, isRead: true, readAt: now } : n));
  }, [user, supabase]);

  const dismiss = useCallback(async (id: string): Promise<void> => {
    await supabase.from('notifications').update({ is_dismissed: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isDismissed: true } : n));
  }, [supabase]);

  const dismissAll = useCallback(async (): Promise<void> => {
    if (!user) return;
    await supabase.from('notifications').update({ is_dismissed: true }).eq('is_dismissed', false);
    setNotifications(prev => prev.map(n => ({ ...n, isDismissed: true })));
  }, [user, supabase]);

  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [supabase]);

  const getUnread = useCallback((): Notification[] => {
    return notifications.filter(n => !n.isRead && !n.isDismissed);
  }, [notifications]);

  const getByType = useCallback((type: NotificationType): Notification[] => {
    return notifications.filter(n => n.type === type && !n.isDismissed);
  }, [notifications]);

  const getByPriority = useCallback((priority: NotificationPriority): Notification[] => {
    return notifications.filter(n => n.priority === priority && !n.isDismissed);
  }, [notifications]);

  const getForAccount = useCallback((accountId: string): Notification[] => {
    return notifications.filter(n => n.accountId === accountId && !n.isDismissed);
  }, [notifications]);

  const getForCase = useCallback((caseId: string): Notification[] => {
    return notifications.filter(n => n.caseId === caseId && !n.isDismissed);
  }, [notifications]);

  const getRecent = useCallback((limit: number = 10): Notification[] => {
    return [...notifications]
      .filter(n => !n.isDismissed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [notifications]);

  const getUrgent = useCallback((): Notification[] => {
    return notifications.filter(n => !n.isRead && !n.isDismissed && ['high', 'urgent'].includes(n.priority));
  }, [notifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead && !n.isDismissed).length, [notifications]);
  const urgentCount = useMemo(() => notifications.filter(n => !n.isRead && !n.isDismissed && ['high', 'urgent'].includes(n.priority)).length, [notifications]);

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: unreadCount,
    urgent: urgentCount,
    byType: notifications.reduce((acc, n) => {
      if (!n.isDismissed) acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>),
  }), [notifications, unreadCount, urgentCount]);

  return {
    notifications: notifications.filter(n => !n.isDismissed),
    isLoading, error, unreadCount, urgentCount, stats,
    addNotification, markAsRead, markAllAsRead, dismiss, dismissAll, deleteNotification,
    getUnread, getByType, getByPriority, getForAccount, getForCase, getRecent, getUrgent,
  };
}
