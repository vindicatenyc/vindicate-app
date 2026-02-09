'use client';

/**
 * Custom hook for managing activities — backed by Supabase
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Activity, ActivityType } from '@vindicate/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { activityFromRow, activityToRow } from '@/lib/supabase/mappers';

export type NewActivity = Omit<Activity, 'id' | 'createdAt' | 'updatedAt' | 'documentIds'> & {
  documentIds?: string[];
};

export type ActivityUpdate = Partial<Omit<Activity, 'id' | 'createdAt'>>;

export interface ActivityFilters {
  accountId?: string;
  type?: ActivityType | ActivityType[];
  direction?: 'inbound' | 'outbound';
  isHarassment?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export type ActivitySortField = 'date' | 'type' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface ActivitySort {
  field: ActivitySortField;
  direction: SortDirection;
}

export function useActivities() {
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setActivities((data ?? []).map(activityFromRow));
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addActivity = useCallback(async (newActivity: NewActivity): Promise<Activity | null> => {
    if (!user) return null;
    const row = {
      ...activityToRow(newActivity),
      user_id: user.id,
      document_ids: newActivity.documentIds ?? [],
    };
    const { data, error: insertError } = await supabase
      .from('activities')
      .insert(row)
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return null;
    }
    const activity = activityFromRow(data);
    setActivities(prev => [activity, ...prev]);
    return activity;
  }, [user, supabase]);

  const updateActivity = useCallback(async (id: string, updates: ActivityUpdate): Promise<Activity | null> => {
    const row = activityToRow(updates);
    const { data, error: updateError } = await supabase
      .from('activities')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      setError(updateError.message);
      return null;
    }
    const activity = activityFromRow(data);
    setActivities(prev => prev.map(a => a.id === id ? activity : a));
    return activity;
  }, [supabase]);

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    setActivities(prev => prev.filter(a => a.id !== id));
    return true;
  }, [supabase]);

  const getActivity = useCallback((id: string): Activity | undefined => {
    return activities.find(activity => activity.id === id);
  }, [activities]);

  const getActivitiesForAccount = useCallback((accountId: string): Activity[] => {
    return activities.filter(activity => activity.accountId === accountId);
  }, [activities]);

  const getFilteredActivities = useCallback((
    filters?: ActivityFilters,
    sort?: ActivitySort
  ): Activity[] => {
    let result = [...activities];
    if (filters) {
      if (filters.accountId) result = result.filter(a => a.accountId === filters.accountId);
      if (filters.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        result = result.filter(a => types.includes(a.type));
      }
      if (filters.direction) result = result.filter(a => a.direction === filters.direction);
      if (filters.isHarassment !== undefined) result = result.filter(a => a.isHarassment === filters.isHarassment);
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        result = result.filter(a => new Date(a.date) >= startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        result = result.filter(a => new Date(a.date) <= endDate);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(a => a.title.toLowerCase().includes(search) || a.notes?.toLowerCase().includes(search));
      }
    }
    const sortConfig = sort || { field: 'date' as const, direction: 'desc' as SortDirection };
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'date': comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'type': comparison = a.type.localeCompare(b.type); break;
        case 'title': comparison = a.title.localeCompare(b.title); break;
      }
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
    return result;
  }, [activities]);

  const getRecentActivities = useCallback((limit: number = 10): Activity[] => {
    return [...activities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [activities]);

  const getHarassmentIncidents = useCallback((): Activity[] => {
    return activities.filter(a => a.isHarassment);
  }, [activities]);

  const linkDocument = useCallback(async (activityId: string, documentId: string): Promise<void> => {
    const current = activities.find(a => a.id === activityId);
    if (!current || current.documentIds.includes(documentId)) return;
    await updateActivity(activityId, { documentIds: [...current.documentIds, documentId] });
  }, [activities, updateActivity]);

  const stats = useMemo(() => ({
    totalActivities: activities.length,
    byType: activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<ActivityType, number>),
    harassmentCount: activities.filter(a => a.isHarassment).length,
    paymentsMade: activities.filter(a => a.type === 'payment-made').length,
    totalPaymentAmount: activities.filter(a => a.type === 'payment-made' && a.amount).reduce((sum, a) => sum + (a.amount || 0), 0),
  }), [activities]);

  return {
    activities,
    isLoading,
    error,
    stats,
    addActivity,
    updateActivity,
    deleteActivity,
    getActivity,
    getActivitiesForAccount,
    getFilteredActivities,
    getRecentActivities,
    getHarassmentIncidents,
    linkDocument,
  };
}
