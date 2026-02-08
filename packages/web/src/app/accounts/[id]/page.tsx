'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounts } from '@/hooks/use-accounts';
import { AccountHeader } from '@/components/accounts/detail/account-header';
import { AccountOverview } from '@/components/accounts/detail/account-overview';
import { AccountActivityTab } from '@/components/accounts/detail/account-activity-tab';
import { AccountDocumentsTab } from '@/components/accounts/detail/account-documents-tab';
import { AccountPaymentTab } from '@/components/accounts/detail/account-payment-tab';
import { VinnyTipCard } from '@/components/vinny/vinny-tip-card';
import { generateAccountTip } from '@/lib/vinny/tip-generator';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'documents', label: 'Documents' },
  { id: 'payment-plan', label: 'Payment Plan' },
  { id: 'notes', label: 'Notes' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { getAccount } = useAccounts();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const account = getAccount(params.id);
  const tip = useMemo(
    () => (account ? generateAccountTip(account) : null),
    [account]
  );

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Account not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The account you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push('/accounts')}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Back to Accounts
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AccountHeader account={account} />

      {/* Vinny contextual tip */}
      {tip && <VinnyTipCard tip={tip} />}

      {/* Tab navigation */}
      <div className="border-b border-border" role="tablist" aria-label="Account detail tabs">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'overview' && <AccountOverview account={account} />}
        {activeTab === 'activity' && <AccountActivityTab accountId={account.id} />}
        {activeTab === 'documents' && <AccountDocumentsTab accountId={account.id} />}
        {activeTab === 'payment-plan' && <AccountPaymentTab account={account} />}
        {activeTab === 'notes' && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </h2>
            {account.notes ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">{account.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No notes for this account.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
