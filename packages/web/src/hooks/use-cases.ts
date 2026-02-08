'use client';

/**
 * Custom hook for managing cases
 * Provides CRUD operations on case data
 */

import { useState, useCallback, useMemo } from 'react';
import type { VindicateCase, VindicateCaseStatus, CaseType, CaseReminder } from '@vindicate/shared';
import { mockCases as initialCases } from '@/lib/mock-data';

export type NewCase = Omit<VindicateCase, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'documentIds' | 'activityIds' | 'reminders'> & {
  statusHistory?: VindicateCase['statusHistory'];
  documentIds?: string[];
  activityIds?: string[];
  reminders?: CaseReminder[];
};

export type CaseUpdate = Partial<Omit<VindicateCase, 'id' | 'createdAt'>>;

export interface CaseFilters {
  accountId?: string;
  type?: CaseType | CaseType[];
  status?: VindicateCaseStatus | VindicateCaseStatus[];
  hasUpcomingDeadline?: boolean;
  search?: string;
}

export type CaseSortField = 'dateFiled' | 'responseDeadline' | 'title' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface CaseSort {
  field: CaseSortField;
  direction: SortDirection;
}

function generateId(): string {
  return `case-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateReminderId(): string {
  return `rem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useCases() {
  const [cases, setCases] = useState<VindicateCase[]>(initialCases);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new case
  const addCase = useCallback((newCase: NewCase): VindicateCase => {
    const now = new Date().toISOString();
    const caseItem: VindicateCase = {
      ...newCase,
      id: generateId(),
      statusHistory: newCase.statusHistory || [],
      documentIds: newCase.documentIds || [],
      activityIds: newCase.activityIds || [],
      reminders: newCase.reminders || [],
      createdAt: now,
      updatedAt: now,
    };

    setCases(prev => [...prev, caseItem]);
    return caseItem;
  }, []);

  // Update an existing case
  const updateCase = useCallback((id: string, updates: CaseUpdate): VindicateCase | null => {
    let updatedCase: VindicateCase | null = null;

    setCases(prev =>
      prev.map(caseItem => {
        if (caseItem.id === id) {
          updatedCase = {
            ...caseItem,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return updatedCase;
        }
        return caseItem;
      })
    );

    return updatedCase;
  }, []);

  // Delete a case
  const deleteCase = useCallback((id: string): boolean => {
    let deleted = false;
    setCases(prev => {
      const newCases = prev.filter(caseItem => {
        if (caseItem.id === id) {
          deleted = true;
          return false;
        }
        return true;
      });
      return newCases;
    });
    return deleted;
  }, []);

  // Get a single case by ID
  const getCase = useCallback((id: string): VindicateCase | undefined => {
    return cases.find(caseItem => caseItem.id === id);
  }, [cases]);

  // Update case status with history tracking
  const updateCaseStatus = useCallback((
    id: string,
    newStatus: VindicateCaseStatus,
    notes?: string
  ): VindicateCase | null => {
    let updatedCase: VindicateCase | null = null;

    setCases(prev =>
      prev.map(caseItem => {
        if (caseItem.id === id && caseItem.status !== newStatus) {
          const statusChange = {
            from: caseItem.status,
            to: newStatus,
            date: new Date().toISOString(),
            notes,
          };

          updatedCase = {
            ...caseItem,
            status: newStatus,
            statusHistory: [...caseItem.statusHistory, statusChange],
            updatedAt: new Date().toISOString(),
          };
          return updatedCase;
        }
        return caseItem;
      })
    );

    return updatedCase;
  }, []);

  // Add a reminder to a case
  const addReminder = useCallback((
    caseId: string,
    reminder: Omit<CaseReminder, 'id' | 'caseId'>
  ): CaseReminder | null => {
    const newReminder: CaseReminder = {
      ...reminder,
      id: generateReminderId(),
      caseId,
    };

    let added = false;
    setCases(prev =>
      prev.map(caseItem => {
        if (caseItem.id === caseId) {
          added = true;
          return {
            ...caseItem,
            reminders: [...caseItem.reminders, newReminder],
            updatedAt: new Date().toISOString(),
          };
        }
        return caseItem;
      })
    );

    return added ? newReminder : null;
  }, []);

  // Complete a reminder
  const completeReminder = useCallback((caseId: string, reminderId: string): void => {
    setCases(prev =>
      prev.map(caseItem => {
        if (caseItem.id === caseId) {
          return {
            ...caseItem,
            reminders: caseItem.reminders.map(r =>
              r.id === reminderId ? { ...r, isCompleted: true } : r
            ),
            updatedAt: new Date().toISOString(),
          };
        }
        return caseItem;
      })
    );
  }, []);

  // Delete a reminder
  const deleteReminder = useCallback((caseId: string, reminderId: string): void => {
    setCases(prev =>
      prev.map(caseItem => {
        if (caseItem.id === caseId) {
          return {
            ...caseItem,
            reminders: caseItem.reminders.filter(r => r.id !== reminderId),
            updatedAt: new Date().toISOString(),
          };
        }
        return caseItem;
      })
    );
  }, []);

  // Get cases for a specific account
  const getCasesForAccount = useCallback((accountId: string): VindicateCase[] => {
    return cases.filter(c => c.accountId === accountId);
  }, [cases]);

  // Get active cases (not resolved or closed)
  const getActiveCases = useCallback((): VindicateCase[] => {
    return cases.filter(c => !['resolved', 'closed'].includes(c.status));
  }, [cases]);

  // Filter and sort cases
  const getFilteredCases = useCallback((
    filters?: CaseFilters,
    sort?: CaseSort
  ): VindicateCase[] => {
    let result = [...cases];

    // Apply filters
    if (filters) {
      if (filters.accountId) {
        result = result.filter(c => c.accountId === filters.accountId);
      }

      if (filters.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        result = result.filter(c => types.includes(c.type));
      }

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        result = result.filter(c => statuses.includes(c.status));
      }

      if (filters.hasUpcomingDeadline) {
        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);

        result = result.filter(c => {
          if (!c.responseDeadline) return false;
          const deadline = new Date(c.responseDeadline);
          return deadline >= now && deadline <= twoWeeksFromNow;
        });
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(c =>
          c.title.toLowerCase().includes(search) ||
          c.description?.toLowerCase().includes(search) ||
          c.caseNumber?.toLowerCase().includes(search)
        );
      }
    }

    // Apply sort (default to dateFiled descending)
    const sortConfig = sort || { field: 'dateFiled', direction: 'desc' as SortDirection };

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'dateFiled':
          comparison = new Date(a.dateFiled).getTime() - new Date(b.dateFiled).getTime();
          break;
        case 'responseDeadline':
          if (!a.responseDeadline && !b.responseDeadline) comparison = 0;
          else if (!a.responseDeadline) comparison = 1;
          else if (!b.responseDeadline) comparison = -1;
          else comparison = new Date(a.responseDeadline).getTime() - new Date(b.responseDeadline).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [cases]);

  // Get all upcoming reminders across all cases
  const getUpcomingReminders = useCallback((): Array<{ reminder: CaseReminder; case: VindicateCase }> => {
    const allReminders: Array<{ reminder: CaseReminder; case: VindicateCase }> = [];

    for (const caseItem of cases) {
      for (const reminder of caseItem.reminders) {
        if (!reminder.isCompleted) {
          allReminders.push({ reminder, case: caseItem });
        }
      }
    }

    return allReminders.sort((a, b) =>
      new Date(a.reminder.date).getTime() - new Date(b.reminder.date).getTime()
    );
  }, [cases]);

  // Computed stats
  const stats = useMemo(() => ({
    totalCases: cases.length,
    activeCases: cases.filter(c => !['resolved', 'closed'].includes(c.status)).length,
    byType: cases.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<CaseType, number>),
    byStatus: cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<VindicateCaseStatus, number>),
    pendingReminders: cases.reduce(
      (sum, c) => sum + c.reminders.filter(r => !r.isCompleted).length,
      0
    ),
  }), [cases]);

  return {
    cases,
    isLoading,
    error,
    stats,
    addCase,
    updateCase,
    deleteCase,
    getCase,
    updateCaseStatus,
    addReminder,
    completeReminder,
    deleteReminder,
    getCasesForAccount,
    getActiveCases,
    getFilteredCases,
    getUpcomingReminders,
  };
}
