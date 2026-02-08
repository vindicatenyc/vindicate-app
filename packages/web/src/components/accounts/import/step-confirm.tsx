'use client';

import { CheckCircle2 } from 'lucide-react';
import { MOCK_FOUND_ACCOUNTS } from './step-review';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/utils/format-date';

interface StepConfirmProps {
  selectedIds: Set<string>;
  onConfirm: () => void;
  isImporting: boolean;
}

export function StepConfirm({ selectedIds, onConfirm, isImporting }: StepConfirmProps) {
  const selectedAccounts = MOCK_FOUND_ACCOUNTS.filter(a => selectedIds.has(a.id));
  const totalBalance = selectedAccounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-3" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">
          Ready to import {selectedAccounts.length} {selectedAccounts.length === 1 ? 'account' : 'accounts'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Total balance: {formatCurrency(totalBalance)}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {selectedAccounts.map(acct => (
          <div key={acct.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{acct.creditorName}</span>
              <StatusBadge status={acct.status} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(acct.balance)}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onConfirm}
        disabled={isImporting}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {isImporting ? 'Importing...' : `Import ${selectedAccounts.length} Accounts`}
      </button>
    </div>
  );
}
