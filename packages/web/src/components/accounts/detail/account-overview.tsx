'use client';

import type { Account } from '@vindicate/shared';
import { ACCOUNT_CATEGORY_CONFIG } from '@vindicate/shared';
import { CountdownBadge } from '@/components/ui/countdown-badge';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format-date';
import { StatusTimeline } from './status-timeline';

interface AccountOverviewProps {
  account: Account;
}

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
      <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-foreground text-right">{value}</dd>
    </div>
  );
}

export function AccountOverview({ account }: AccountOverviewProps) {
  const categoryLabel = account.category
    ? ACCOUNT_CATEGORY_CONFIG[account.category].label
    : undefined;

  return (
    <div className="space-y-6">
      {/* Financial Details */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Financial Details
        </h2>
        <dl>
          <InfoRow label="Original Balance" value={formatCurrency(account.originalBalance)} />
          <InfoRow label="Current Balance" value={formatCurrency(account.currentBalance)} />
          <InfoRow
            label="Interest Rate"
            value={account.interestRate !== undefined ? `${account.interestRate}%` : undefined}
          />
          <InfoRow
            label="Minimum Payment"
            value={account.minimumPayment !== undefined ? formatCurrency(account.minimumPayment) : undefined}
          />
        </dl>
      </section>

      {/* Creditor Info */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Creditor Information
        </h2>
        <dl>
          <InfoRow label="Creditor" value={account.creditorName} />
          <InfoRow label="Account Number" value={account.accountNumber} />
          <InfoRow label="Phone" value={account.creditorPhone} />
          <InfoRow label="Address" value={account.creditorAddress} />
          <InfoRow label="Category" value={categoryLabel} />
          {account.collectorName && (
            <InfoRow label="Collector" value={account.collectorName} />
          )}
        </dl>
      </section>

      {/* Key Dates */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Key Dates
        </h2>
        <dl>
          <InfoRow
            label="Account Opened"
            value={new Date(account.dateOpened).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          />
          <InfoRow
            label="Last Activity"
            value={formatRelativeDate(account.dateOfLastActivity)}
          />
          <InfoRow
            label="Added to App"
            value={new Date(account.dateAddedToApp).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          />
        </dl>
      </section>

      {/* SOL Countdown */}
      {account.statuteOfLimitationsDate && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Statute of Limitations
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {account.statuteOfLimitationsState || 'NY'} SOL expires on{' '}
                {new Date(account.statuteOfLimitationsDate).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
            <CountdownBadge
              deadline={account.statuteOfLimitationsDate}
              label="SOL Expiry"
            />
          </div>
        </section>
      )}

      {/* Notes */}
      {account.notes && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">{account.notes}</p>
        </section>
      )}

      {/* Status History */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Status History
        </h2>
        <StatusTimeline statusHistory={account.statusHistory} />
      </section>
    </div>
  );
}
