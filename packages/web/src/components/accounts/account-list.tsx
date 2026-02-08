'use client';

import { useState, useMemo } from 'react';
import { Search, Wallet } from 'lucide-react';
import { useAccounts } from '@/hooks/use-accounts';
import type { AccountFilters, AccountSort } from '@/hooks/use-accounts';
import { AccountCard } from './account-card';
import { AccountFiltersBar } from './account-filters';
import { AccountSortDropdown } from './account-sort';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface AccountListProps {
  className?: string;
}

export function AccountList({ className }: AccountListProps) {
  const { getFilteredAccounts } = useAccounts();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AccountFilters>({});
  const [sort, setSort] = useState<AccountSort>({ field: 'currentBalance', direction: 'desc' });

  const combinedFilters = useMemo<AccountFilters>(
    () => ({ ...filters, search: search || undefined }),
    [filters, search]
  );

  const filteredAccounts = useMemo(
    () => getFilteredAccounts(combinedFilters, sort),
    [getFilteredAccounts, combinedFilters, sort]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search + Sort row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            aria-label="Search accounts by name"
          />
        </div>
        <AccountSortDropdown sort={sort} onSortChange={setSort} />
      </div>

      {/* Filters */}
      <AccountFiltersBar filters={filters} onFiltersChange={setFilters} />

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'} found
      </p>

      {/* Account grid */}
      {filteredAccounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map(account => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wallet}
          title="No accounts match"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      )}
    </div>
  );
}
