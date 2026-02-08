'use client';

import Link from 'next/link';
import type { VindicateCase } from '@vindicate/shared';
import { CASE_STATUS_CONFIG } from '@vindicate/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { CountdownBadge } from '@/components/ui/countdown-badge';
import { Badge } from '@/components/ui/badge';
import { useAccounts } from '@/hooks/use-accounts';
import { cn } from '@/lib/utils';

const CASE_TYPE_LABELS: Record<string, string> = {
  'credit-bureau-dispute': 'Credit Bureau Dispute',
  'debt-validation': 'Debt Validation',
  'fdcpa-complaint': 'FDCPA Complaint',
  'lawsuit-defendant': 'Lawsuit (Defendant)',
  'lawsuit-plaintiff': 'Lawsuit (Plaintiff)',
  'arbitration': 'Arbitration',
  'cfpb-complaint': 'CFPB Complaint',
  'other': 'Other',
};

interface CaseCardProps {
  caseItem: VindicateCase;
  className?: string;
}

export function CaseCard({ caseItem, className }: CaseCardProps) {
  const { getAccount } = useAccounts();
  const account = getAccount(caseItem.accountId);
  const typeLabel = CASE_TYPE_LABELS[caseItem.type] ?? caseItem.type;

  return (
    <Link
      href={`/cases/${caseItem.id}`}
      className={cn(
        'group block rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
      aria-label={`View case: ${caseItem.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {caseItem.title}
        </h3>
        <StatusBadge status={caseItem.status} type="case" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
        {account && (
          <Badge variant="outline" className="text-xs">{account.creditorName}</Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="block">Filed</span>
          <span className="font-medium text-foreground">
            {new Date(caseItem.dateFiled).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        {caseItem.responseDeadline && (
          <div>
            <span className="block">Deadline</span>
            <CountdownBadge deadline={caseItem.responseDeadline} />
          </div>
        )}
      </div>
    </Link>
  );
}
