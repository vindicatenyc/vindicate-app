'use client';

import type { Account, AccountCategory, AccountStatus } from '@vindicate/shared';
import { ACCOUNT_STATUS_CONFIG, ACCOUNT_CATEGORY_CONFIG } from '@vindicate/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/utils/format-date';
import { cn } from '@/lib/utils';

interface MockFoundAccount {
  id: string;
  creditorName: string;
  balance: number;
  status: AccountStatus;
  category: AccountCategory;
}

const MOCK_FOUND_ACCOUNTS: MockFoundAccount[] = [
  { id: 'import-1', creditorName: 'Wells Fargo', balance: 2300, status: 'in-collections', category: 'credit-card' },
  { id: 'import-2', creditorName: 'Sallie Mae', balance: 15000, status: 'late', category: 'student-loan' },
  { id: 'import-3', creditorName: 'Kaiser Permanente', balance: 890, status: 'in-collections', category: 'medical' },
  { id: 'import-4', creditorName: 'Best Buy / Citibank', balance: 1450, status: 'charged-off', category: 'credit-card' },
];

interface StepReviewProps {
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export { MOCK_FOUND_ACCOUNTS };

export function StepReview({ selectedIds, onToggleSelect, onSelectAll, onDeselectAll }: StepReviewProps) {
  const allSelected = selectedIds.size === MOCK_FOUND_ACCOUNTS.length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          We found {MOCK_FOUND_ACCOUNTS.length} accounts
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select which accounts you&apos;d like to import and track.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} of {MOCK_FOUND_ACCOUNTS.length} selected
        </span>
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-sm font-medium text-primary hover:underline"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="space-y-2">
        {MOCK_FOUND_ACCOUNTS.map(acct => {
          const isSelected = selectedIds.has(acct.id);
          return (
            <label
              key={acct.id}
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors',
                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(acct.id)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                aria-label={`Select ${acct.creditorName}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{acct.creditorName}</span>
                  <StatusBadge status={acct.status} />
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{ACCOUNT_CATEGORY_CONFIG[acct.category].label}</span>
                  <span>{formatCurrency(acct.balance)}</span>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
