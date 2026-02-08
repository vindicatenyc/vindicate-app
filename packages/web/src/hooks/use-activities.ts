'use client';

/**
 * Custom hook for managing activities
 * Provides CRUD operations on activity data
 */

import { useState, useCallback, useMemo } from 'react';
import type { Activity, ActivityType } from '@vindicate/shared';
import { mockActivities as initialActivities } from '@/lib/mock-data';

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

function generateId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new activity
  const addActivity = useCallback((newActivity: NewActivity): Activity => {
    const now = new Date().toISOString();
    const activity: Activity = {
      ...newActivity,
      id: generateId(),
      documentIds: newActivity.documentIds || [],
      createdAt: now,
      updatedAt: now,
    };

    setActivities(prev => [...prev, activity]);
    return activity;
  }, []);

  // Update an existing activity
  const updateActivity = useCallback((id: string, updates: ActivityUpdate): Activity | null => {
    let updatedActivity: Activity | null = null;

    setActivities(prev =>
      prev.map(activity => {
        if (activity.id === id) {
          updatedActivity = {
            ...activity,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return updatedActivity;
        }
        return activity;
      })
    );

    return updatedActivity;
  }, []);

  // Delete an activity
  const deleteActivity = useCallback((id: string): boolean => {
    let deleted = false;
    setActivities(prev => {
      const newActivities = prev.filter(activity => {
        if (activity.id === id) {
          deleted = true;
          return false;
        }
        return true;
      });
      return newActivities;
    });
    return deleted;
  }, []);

  // Get a single activity by ID
  const getActivity = useCallback((id: string): Activity | undefined => {
    return activities.find(activity => activity.id === id);
  }, [activities]);

  // Get activities for a specific account
  const getActivitiesForAccount = useCallback((accountId: string): Activity[] => {
    return activities.filter(activity => activity.accountId === accountId);
  }, [activities]);

  // Filter and sort activities
  const getFilteredActivities = useCallback((
    filters?: ActivityFilters,
    sort?: ActivitySort
  ): Activity[] => {
    let result = [...activities];

    // Apply filters
    if (filters) {
      if (filters.accountId) {
        result = result.filter(a => a.accountId === filters.accountId);
      }

      if (filters.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        result = result.filter(a => types.includes(a.type));
      }

      if (filters.direction) {
        result = result.filter(a => a.direction === filters.direction);
      }

      if (filters.isHarassment !== undefined) {
        result = result.filter(a => a.isHarassment === filters.isHarassment);
      }

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
        result = result.filter(a =>
          a.title.toLowerCase().includes(search) ||
          a.notes?.toLowerCase().includes(search)
        );
      }
    }

    // Apply sort (default to date descending)
    const sortConfig = sort || { field: 'date', direction: 'desc' as SortDirection };

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [activities]);

  // Get recent activities
  const getRecentActivities = useCallback((limit: number = 10): Activity[] => {
    return [...activities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [activities]);

  // Get harassment incidents
  const getHarassmentIncidents = useCallback((): Activity[] => {
    return activities.filter(a => a.isHarassment);
  }, [activities]);

  // Link a document to an activity
  const linkDocument = useCallback((activityId: string, documentId: string): void => {
    setActivities(prev =>
      prev.map(activity => {
        if (activity.id === activityId && !activity.documentIds.includes(documentId)) {
          return {
            ...activity,
            documentIds: [...activity.documentIds, documentId],
            updatedAt: new Date().toISOString(),
          };
        }
        return activity;
      })
    );
  }, []);

  // Computed stats
  const stats = useMemo(() => ({
    totalActivities: activities.length,
    byType: activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<ActivityType, number>),
    harassmentCount: activities.filter(a => a.isHarassment).length,
    paymentsMade: activities.filter(a => a.type === 'payment-made').length,
    totalPaymentAmount: activities
      .filter(a => a.type === 'payment-made' && a.amount)
      .reduce((sum, a) => sum + (a.amount || 0), 0),
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
