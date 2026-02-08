'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CASE_STATUS_CONFIG } from '@vindicate/shared';
import { useCases } from '@/hooks/use-cases';
import { useAccounts } from '@/hooks/use-accounts';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { CaseStatusTimeline } from '@/components/cases/case-status-timeline';
import { CaseDeadlines } from '@/components/cases/case-deadlines';
import { CaseReminderForm } from '@/components/cases/case-reminder-form';

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

export default function CaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { getCase, completeReminder, addReminder } = useCases();
  const { getAccount } = useAccounts();
  const caseItem = getCase(params.id);

  const handleCompleteReminder = useCallback(
    (reminderId: string) => {
      if (caseItem) {
        completeReminder(caseItem.id, reminderId);
      }
    },
    [caseItem, completeReminder]
  );

  const handleAddReminder = useCallback(
    (reminder: { title: string; date: string; notes?: string; isCompleted: boolean }) => {
      if (caseItem) {
        addReminder(caseItem.id, reminder);
      }
    },
    [caseItem, addReminder]
  );

  if (!caseItem) {
    notFound();
  }

  const account = getAccount(caseItem.accountId);
  const typeLabel = CASE_TYPE_LABELS[caseItem.type] ?? caseItem.type;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </Link>
        <PageHeader
          title={caseItem.title}
          actions={
            <StatusBadge status={caseItem.status} type="case" />
          }
        />
      </div>

      {/* Status Timeline */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Progress</h2>
        <CaseStatusTimeline
          caseType={caseItem.type}
          currentStatus={caseItem.status}
        />
      </div>

      {/* Case Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Case Information</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Type</span>
              <Badge variant="secondary">{typeLabel}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Status</span>
              <span className="font-medium">{CASE_STATUS_CONFIG[caseItem.status].label}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Filed</span>
              <span className="font-medium">
                {new Date(caseItem.dateFiled).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {caseItem.responseDeadline && (
              <div>
                <span className="text-muted-foreground block text-xs">Response Deadline</span>
                <span className="font-medium">
                  {new Date(caseItem.responseDeadline).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {caseItem.caseNumber && (
              <div>
                <span className="text-muted-foreground block text-xs">Case Number</span>
                <span className="font-medium font-mono text-xs">{caseItem.caseNumber}</span>
              </div>
            )}
            {caseItem.creditBureau && (
              <div>
                <span className="text-muted-foreground block text-xs">Credit Bureau</span>
                <span className="font-medium capitalize">{caseItem.creditBureau}</span>
              </div>
            )}
          </div>

          {/* Linked Account */}
          {account && (
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Linked Account</span>
              <Link
                href={`/accounts/${account.id}`}
                className="inline-flex"
              >
                <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                  {account.creditorName}
                </Badge>
              </Link>
            </div>
          )}

          {/* Description */}
          {caseItem.description && (
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Description</span>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {caseItem.description}
              </p>
            </div>
          )}

          {/* Dispute Reason */}
          {caseItem.disputeReason && (
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Dispute Reason</span>
              <p className="text-sm text-foreground">{caseItem.disputeReason}</p>
            </div>
          )}
        </div>

        {/* Deadlines & Reminders */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Deadlines & Reminders</h2>

          <CaseDeadlines
            reminders={caseItem.reminders}
            responseDeadline={caseItem.responseDeadline}
            hearingDate={caseItem.hearingDate}
            onCompleteReminder={handleCompleteReminder}
          />

          <CaseReminderForm onAdd={handleAddReminder} />
        </div>
      </div>
    </div>
  );
}
