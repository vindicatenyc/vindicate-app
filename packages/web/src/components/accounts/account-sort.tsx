'use client';

import { ArrowUpDown } from 'lucide-react';
import type { AccountSort, AccountSortField, SortDirection } from '@/hooks/use-accounts';
import { cn } from '@/lib/utils';

interface AccountSortDropdownProps {
  sort: AccountSort;
  onSortChange: (sort: AccountSort) => void;
  className?: string;
}

const SORT_OPTIONS: { field: AccountSortField; label: string }[] = [
  { field: 'currentBalance', label: 'Balance' },
  { field: 'dateAddedToApp', label: 'Date Added' },
  { field: 'dateOfLastActivity', label: 'Last Activity' },
  { field: 'creditorName', label: 'Creditor Name' },
];

export function AccountSortDropdown({ sort, onSortChange, className }: AccountSortDropdownProps) {
  function handleFieldChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onSortChange({ field: e.target.value as AccountSortField, direction: sort.direction });
  }

  function toggleDirection() {
    const newDir: SortDirection = sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field: sort.field, direction: newDir });
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor="account-sort" className="sr-only">Sort accounts by</label>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Sort by</span>
      </div>
      <select
        id="account-sort"
        value={sort.field}
        onChange={handleFieldChange}
        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.field} value={opt.field}>{opt.label}</option>
        ))}
      </select>
      <button
        onClick={toggleDirection}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-xs text-muted-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        aria-label={`Sort ${sort.direction === 'asc' ? 'ascending' : 'descending'}, click to toggle`}
        title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sort.direction === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
}
