'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import type { AccountStatus, AccountCategory } from '@vindicate/shared';
import { ACCOUNT_STATUS_CONFIG, ACCOUNT_CATEGORY_CONFIG } from '@vindicate/shared';
import type { AccountFilters } from '@/hooks/use-accounts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccountFiltersBarProps {
  filters: AccountFilters;
  onFiltersChange: (filters: AccountFilters) => void;
  className?: string;
}

const ALL_STATUSES: AccountStatus[] = [
  'current', 'late', 'in-collections', 'charged-off', 'disputed',
  'payment-plan', 'settled', 'paid-in-full', 'in-litigation', 'bankrupt',
];

const ALL_CATEGORIES: AccountCategory[] = [
  'credit-card', 'medical', 'student-loan', 'auto-loan',
  'personal-loan', 'utility', 'rent', 'tax', 'other',
];

export function AccountFiltersBar({ filters, onFiltersChange, className }: AccountFiltersBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const selectedStatuses = filters.status
    ? Array.isArray(filters.status) ? filters.status : [filters.status]
    : [];

  const selectedCategories = filters.category
    ? Array.isArray(filters.category) ? filters.category : [filters.category]
    : [];

  const hasActiveFilters = selectedStatuses.length > 0 || selectedCategories.length > 0;

  function toggleStatus(status: AccountStatus) {
    const current = [...selectedStatuses];
    const idx = current.indexOf(status);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(status);
    }
    onFiltersChange({
      ...filters,
      status: current.length > 0 ? current : undefined,
    });
  }

  function toggleCategory(category: AccountCategory) {
    const current = [...selectedCategories];
    const idx = current.indexOf(category);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(category);
    }
    onFiltersChange({
      ...filters,
      category: current.length > 0 ? current : undefined,
    });
  }

  function clearFilters() {
    onFiltersChange({
      ...filters,
      status: undefined,
      category: undefined,
    });
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="account-filters-panel"
        >
          <Filter className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {selectedStatuses.length + selectedCategories.length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div
          id="account-filters-panel"
          className="rounded-lg border border-border bg-card p-4 space-y-4"
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {ALL_STATUSES.map(status => {
                const config = ACCOUNT_STATUS_CONFIG[status];
                const isSelected = selectedStatuses.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                    )}
                    aria-pressed={isSelected}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Category
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {ALL_CATEGORIES.map(category => {
                const config = ACCOUNT_CATEGORY_CONFIG[category];
                const isSelected = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                    )}
                    aria-pressed={isSelected}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
