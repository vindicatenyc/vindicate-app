'use client';

/**
 * Custom hook for managing accounts
 * Provides CRUD operations on account data
 */

import { useState, useCallback, useMemo } from 'react';
import type { Account, AccountStatus, AccountCategory } from '@vindicate/shared';
import { mockAccounts as initialAccounts, mockAccountsSummary } from '@/lib/mock-data';

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

function generateId(): string {
  return `acc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new account
  const addAccount = useCallback((newAccount: NewAccount): Account => {
    const now = new Date().toISOString();
    const account: Account = {
      ...newAccount,
      id: generateId(),
      activityIds: [],
      caseIds: [],
      documentIds: [],
      statusHistory: newAccount.statusHistory || [],
      createdAt: now,
      updatedAt: now,
    };

    setAccounts(prev => [...prev, account]);
    return account;
  }, []);

  // Update an existing account
  const updateAccount = useCallback((id: string, updates: AccountUpdate): Account | null => {
    let updatedAccount: Account | null = null;

    setAccounts(prev =>
      prev.map(account => {
        if (account.id === id) {
          updatedAccount = {
            ...account,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return updatedAccount;
        }
        return account;
      })
    );

    return updatedAccount;
  }, []);

  // Delete an account
  const deleteAccount = useCallback((id: string): boolean => {
    let deleted = false;
    setAccounts(prev => {
      const newAccounts = prev.filter(account => {
        if (account.id === id) {
          deleted = true;
          return false;
        }
        return true;
      });
      return newAccounts;
    });
    return deleted;
  }, []);

  // Get a single account by ID
  const getAccount = useCallback((id: string): Account | undefined => {
    return accounts.find(account => account.id === id);
  }, [accounts]);

  // Update account status with history tracking
  const updateAccountStatus = useCallback((id: string, newStatus: AccountStatus, reason?: string): Account | null => {
    let updatedAccount: Account | null = null;

    setAccounts(prev =>
      prev.map(account => {
        if (account.id === id && account.status !== newStatus) {
          const statusChange = {
            from: account.status,
            to: newStatus,
            date: new Date().toISOString(),
            reason,
          };

          updatedAccount = {
            ...account,
            status: newStatus,
            statusHistory: [...account.statusHistory, statusChange],
            updatedAt: new Date().toISOString(),
          };
          return updatedAccount;
        }
        return account;
      })
    );

    return updatedAccount;
  }, []);

  // Link an activity to an account
  const linkActivity = useCallback((accountId: string, activityId: string): void => {
    setAccounts(prev =>
      prev.map(account => {
        if (account.id === accountId && !account.activityIds.includes(activityId)) {
          return {
            ...account,
            activityIds: [...account.activityIds, activityId],
            updatedAt: new Date().toISOString(),
          };
        }
        return account;
      })
    );
  }, []);

  // Link a case to an account
  const linkCase = useCallback((accountId: string, caseId: string): void => {
    setAccounts(prev =>
      prev.map(account => {
        if (account.id === accountId && !account.caseIds.includes(caseId)) {
          return {
            ...account,
            caseIds: [...account.caseIds, caseId],
            updatedAt: new Date().toISOString(),
          };
        }
        return account;
      })
    );
  }, []);

  // Filter and sort accounts
  const getFilteredAccounts = useCallback((
    filters?: AccountFilters,
    sort?: AccountSort
  ): Account[] => {
    let result = [...accounts];

    // Apply filters
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

    // Apply sort
    if (sort) {
      result.sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
          case 'creditorName':
            comparison = a.creditorName.localeCompare(b.creditorName);
            break;
          case 'currentBalance':
            comparison = a.currentBalance - b.currentBalance;
            break;
          case 'originalBalance':
            comparison = a.originalBalance - b.originalBalance;
            break;
          case 'dateOfLastActivity':
            comparison = new Date(a.dateOfLastActivity).getTime() - new Date(b.dateOfLastActivity).getTime();
            break;
          case 'dateAddedToApp':
            comparison = new Date(a.dateAddedToApp).getTime() - new Date(b.dateAddedToApp).getTime();
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [accounts]);

  // Computed summary
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
