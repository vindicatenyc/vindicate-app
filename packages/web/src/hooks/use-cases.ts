'use client';

/**
 * Custom hook for managing cases — backed by Supabase
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { VindicateCase, VindicateCaseStatus, CaseType, CaseReminder } from '@vindicate/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { caseFromRow, caseToRow } from '@/lib/supabase/mappers';

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

function generateReminderId(): string {
  return `rem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useCases() {
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const [cases, setCases] = useState<VindicateCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setCases((data ?? []).map(caseFromRow));
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const addCase = useCallback(async (newCase: NewCase): Promise<VindicateCase | null> => {
    if (!user) return null;
    const row = {
      ...caseToRow(newCase),
      user_id: user.id,
      status_history: newCase.statusHistory ?? [],
      document_ids: newCase.documentIds ?? [],
      activity_ids: newCase.activityIds ?? [],
      reminders: newCase.reminders ?? [],
    };
    const { data, error: insertError } = await supabase
      .from('cases')
      .insert(row)
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return null;
    }
    const caseItem = caseFromRow(data);
    setCases(prev => [caseItem, ...prev]);
    return caseItem;
  }, [user, supabase]);

  const updateCase = useCallback(async (id: string, updates: CaseUpdate): Promise<VindicateCase | null> => {
    const row = caseToRow(updates);
    const { data, error: updateError } = await supabase
      .from('cases')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      setError(updateError.message);
      return null;
    }
    const caseItem = caseFromRow(data);
    setCases(prev => prev.map(c => c.id === id ? caseItem : c));
    return caseItem;
  }, [supabase]);

  const deleteCase = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase.from('cases').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return false; }
    setCases(prev => prev.filter(c => c.id !== id));
    return true;
  }, [supabase]);

  const getCase = useCallback((id: string): VindicateCase | undefined => {
    return cases.find(c => c.id === id);
  }, [cases]);

  const updateCaseStatus = useCallback(async (id: string, newStatus: VindicateCaseStatus, notes?: string): Promise<VindicateCase | null> => {
    const current = cases.find(c => c.id === id);
    if (!current || current.status === newStatus) return null;
    const statusChange = { from: current.status, to: newStatus, date: new Date().toISOString(), notes };
    return updateCase(id, { status: newStatus, statusHistory: [...current.statusHistory, statusChange] });
  }, [cases, updateCase]);

  const addReminder = useCallback(async (caseId: string, reminder: Omit<CaseReminder, 'id' | 'caseId'>): Promise<CaseReminder | null> => {
    const current = cases.find(c => c.id === caseId);
    if (!current) return null;
    const newReminder: CaseReminder = { ...reminder, id: generateReminderId(), caseId };
    const result = await updateCase(caseId, { reminders: [...current.reminders, newReminder] });
    return result ? newReminder : null;
  }, [cases, updateCase]);

  const completeReminder = useCallback(async (caseId: string, reminderId: string): Promise<void> => {
    const current = cases.find(c => c.id === caseId);
    if (!current) return;
    await updateCase(caseId, { reminders: current.reminders.map(r => r.id === reminderId ? { ...r, isCompleted: true } : r) });
  }, [cases, updateCase]);

  const deleteReminder = useCallback(async (caseId: string, reminderId: string): Promise<void> => {
    const current = cases.find(c => c.id === caseId);
    if (!current) return;
    await updateCase(caseId, { reminders: current.reminders.filter(r => r.id !== reminderId) });
  }, [cases, updateCase]);

  const getCasesForAccount = useCallback((accountId: string): VindicateCase[] => {
    return cases.filter(c => c.accountId === accountId);
  }, [cases]);

  const getActiveCases = useCallback((): VindicateCase[] => {
    return cases.filter(c => !['resolved', 'closed'].includes(c.status));
  }, [cases]);

  const getFilteredCases = useCallback((filters?: CaseFilters, sort?: CaseSort): VindicateCase[] => {
    let result = [...cases];
    if (filters) {
      if (filters.accountId) result = result.filter(c => c.accountId === filters.accountId);
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
        result = result.filter(c => c.title.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search) || c.caseNumber?.toLowerCase().includes(search));
      }
    }
    const sortConfig = sort || { field: 'dateFiled' as const, direction: 'desc' as SortDirection };
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'dateFiled': comparison = new Date(a.dateFiled).getTime() - new Date(b.dateFiled).getTime(); break;
        case 'responseDeadline':
          if (!a.responseDeadline && !b.responseDeadline) comparison = 0;
          else if (!a.responseDeadline) comparison = 1;
          else if (!b.responseDeadline) comparison = -1;
          else comparison = new Date(a.responseDeadline).getTime() - new Date(b.responseDeadline).getTime();
          break;
        case 'title': comparison = a.title.localeCompare(b.title); break;
        case 'status': comparison = a.status.localeCompare(b.status); break;
      }
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
    return result;
  }, [cases]);

  const getUpcomingReminders = useCallback((): Array<{ reminder: CaseReminder; case: VindicateCase }> => {
    const all: Array<{ reminder: CaseReminder; case: VindicateCase }> = [];
    for (const c of cases) {
      for (const r of c.reminders) {
        if (!r.isCompleted) all.push({ reminder: r, case: c });
      }
    }
    return all.sort((a, b) => new Date(a.reminder.date).getTime() - new Date(b.reminder.date).getTime());
  }, [cases]);

  const stats = useMemo(() => ({
    totalCases: cases.length,
    activeCases: cases.filter(c => !['resolved', 'closed'].includes(c.status)).length,
    byType: cases.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {} as Record<CaseType, number>),
    byStatus: cases.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<VindicateCaseStatus, number>),
    pendingReminders: cases.reduce((sum, c) => sum + c.reminders.filter(r => !r.isCompleted).length, 0),
  }), [cases]);

  return {
    cases, isLoading, error, stats,
    addCase, updateCase, deleteCase, getCase,
    updateCaseStatus, addReminder, completeReminder, deleteReminder,
    getCasesForAccount, getActiveCases, getFilteredCases, getUpcomingReminders,
  };
}
