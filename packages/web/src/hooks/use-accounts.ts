'use client';

/**
 * Custom hook for managing accounts — backed by Supabase
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Account, AccountStatus, AccountCategory } from '@vindicate/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { accountFromRow, accountToRow } from '@/lib/supabase/mappers';

export type NewAccount = Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'activityIds' | 'caseIds' | 'documentIds' | 'statusHistory'> & {
  statusHistory?: Account['statusHistory'];
};

export type AccountUpdate = Partial<Omit<Account, 'id' | 'createdAt'>>;

export interface AccountFilters {
  status?: AccountStatus | AccountStatus[];
  category?: AccountCategory | AccountCategory[];
  search?: string;
  minBalance?: number;
  maxBalance?: number;
}

export type AccountSortField = 'creditorName' | 'currentBalance' | 'originalBalance' | 'dateOfLastActivity' | 'dateAddedToApp' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface AccountSort {
  field: AccountSortField;
  direction: SortDirection;
}

export function useAccounts() {
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAccounts((data ?? []).map(accountFromRow));
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = useCallback(async (newAccount: NewAccount): Promise<Account | null> => {
    if (!user) return null;
    const row = {
      ...accountToRow(newAccount),
      user_id: user.id,
      status_history: newAccount.statusHistory ?? [],
      activity_ids: [],
      case_ids: [],
      document_ids: [],
    };
    const { data, error: insertError } = await supabase
      .from('accounts')
      .insert(row)
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return null;
    }
    const account = accountFromRow(data);
    setAccounts(prev => [account, ...prev]);
    return account;
  }, [user, supabase]);

  const updateAccount = useCallback(async (id: string, updates: AccountUpdate): Promise<Account | null> => {
    const row = accountToRow(updates);
    const { data, error: updateError } = await supabase
      .from('accounts')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      setError(updateError.message);
      return null;
    }
    const account = accountFromRow(data);
    setAccounts(prev => prev.map(a => a.id === id ? account : a));
    return account;
  }, [supabase]);

  const deleteAccount = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    return true;
  }, [supabase]);

  const getAccount = useCallback((id: string): Account | undefined => {
    return accounts.find(account => account.id === id);
  }, [accounts]);

  const updateAccountStatus = useCallback(async (id: string, newStatus: AccountStatus, reason?: string): Promise<Account | null> => {
    const current = accounts.find(a => a.id === id);
    if (!current || current.status === newStatus) return null;
    const statusChange = {
      from: current.status,
      to: newStatus,
      date: new Date().toISOString(),
      reason,
    };
    return updateAccount(id, {
      status: newStatus,
      statusHistory: [...current.statusHistory, statusChange],
    });
  }, [accounts, updateAccount]);

  const linkActivity = useCallback(async (accountId: string, activityId: string): Promise<void> => {
    const current = accounts.find(a => a.id === accountId);
    if (!current || current.activityIds.includes(activityId)) return;
    await updateAccount(accountId, {
      activityIds: [...current.activityIds, activityId],
    });
  }, [accounts, updateAccount]);

  const linkCase = useCallback(async (accountId: string, caseId: string): Promise<void> => {
    const current = accounts.find(a => a.id === accountId);
    if (!current || current.caseIds.includes(caseId)) return;
    await updateAccount(accountId, {
      caseIds: [...current.caseIds, caseId],
    });
  }, [accounts, updateAccount]);

  const getFilteredAccounts = useCallback((
    filters?: AccountFilters,
    sort?: AccountSort
  ): Account[] => {
    let result = [...accounts];
    if (filters) {
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        result = result.filter(a => statuses.includes(a.status));
      }
      if (filters.category) {
        const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
        result = result.filter(a => a.category && categories.includes(a.category));
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(a =>
          a.creditorName.toLowerCase().includes(search) ||
          a.collectorName?.toLowerCase().includes(search) ||
          a.accountNumber?.toLowerCase().includes(search)
        );
      }
      if (filters.minBalance !== undefined) {
        result = result.filter(a => a.currentBalance >= filters.minBalance!);
      }
      if (filters.maxBalance !== undefined) {
        result = result.filter(a => a.currentBalance <= filters.maxBalance!);
      }
    }
    if (sort) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sort.field) {
          case 'creditorName': comparison = a.creditorName.localeCompare(b.creditorName); break;
          case 'currentBalance': comparison = a.currentBalance - b.currentBalance; break;
          case 'originalBalance': comparison = a.originalBalance - b.originalBalance; break;
          case 'dateOfLastActivity': comparison = new Date(a.dateOfLastActivity).getTime() - new Date(b.dateOfLastActivity).getTime(); break;
          case 'dateAddedToApp': comparison = new Date(a.dateAddedToApp).getTime() - new Date(b.dateAddedToApp).getTime(); break;
          case 'status': comparison = a.status.localeCompare(b.status); break;
        }
        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }
    return result;
  }, [accounts]);

  const summary = useMemo(() => ({
    totalOriginalDebt: accounts.reduce((sum, acc) => sum + acc.originalBalance, 0),
    totalCurrentDebt: accounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
    accountCount: accounts.length,
    inCollectionsCount: accounts.filter(acc => acc.status === 'in-collections').length,
    disputedCount: accounts.filter(acc => acc.status === 'disputed').length,
    settledCount: accounts.filter(acc => acc.status === 'settled').length,
    paymentPlanCount: accounts.filter(acc => acc.status === 'payment-plan').length,
    paidInFullCount: accounts.filter(acc => acc.status === 'paid-in-full').length,
    totalPaidOff: accounts
      .filter(acc => ['settled', 'paid-in-full'].includes(acc.status))
      .reduce((sum, acc) => sum + acc.originalBalance, 0),
  }), [accounts]);

  return {
    accounts,
    isLoading,
    error,
    summary,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccount,
    updateAccountStatus,
    linkActivity,
    linkCase,
    getFilteredAccounts,
  };
}
