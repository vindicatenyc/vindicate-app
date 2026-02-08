'use client';

import { useMemo } from 'react';
import { Calendar, DollarSign, CheckCircle2, Circle, CreditCard } from 'lucide-react';
import type { Account } from '@vindicate/shared';
import { ProgressBar } from '@/components/ui/progress-bar';
import { CountdownBadge } from '@/components/ui/countdown-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format-date';
import { cn } from '@/lib/utils';

interface AccountPaymentTabProps {
  account: Account;
}

interface MockPayment {
  id: string;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
}

function generateMockPaymentPlan(account: Account): {
  monthlyAmount: number;
  totalPayments: number;
  paymentsMade: number;
  payments: MockPayment[];
  nextDueDate: string;
} | null {
  if (!account.paymentPlanId || !account.minimumPayment) return null;

  const monthly = account.minimumPayment;
  const totalPayments = 18;
  const paymentsMade = Math.round(
    (account.originalBalance - account.currentBalance) / monthly
  );

  const payments: MockPayment[] = [];
  const startDate = new Date('2025-10-15');

  for (let i = 0; i < totalPayments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    const isPaid = i < paymentsMade;

    payments.push({
      id: `payment-${i}`,
      dueDate: dueDate.toISOString(),
      amount: monthly,
      isPaid,
      paidDate: isPaid
        ? new Date(dueDate.getFullYear(), dueDate.getMonth(), 1).toISOString()
        : undefined,
    });
  }

  const nextPayment = payments.find(p => !p.isPaid);
  const nextDueDate = nextPayment?.dueDate ?? payments[payments.length - 1].dueDate;

  return { monthlyAmount: monthly, totalPayments, paymentsMade, payments, nextDueDate };
}

export function AccountPaymentTab({ account }: AccountPaymentTabProps) {
  const plan = useMemo(() => generateMockPaymentPlan(account), [account]);

  if (!plan) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No payment plan"
        description="Set up a payment plan to track your progress toward paying off this account."
        actionLabel="Set Up Plan"
        onAction={() => console.log('Set up payment plan for', account.id)}
      />
    );
  }

  const percentComplete = Math.round((plan.paymentsMade / plan.totalPayments) * 100);
  const totalRemaining = plan.monthlyAmount * (plan.totalPayments - plan.paymentsMade);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs">Monthly Payment</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(plan.monthlyAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs">Total Remaining</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs">Payments Made</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {plan.paymentsMade} / {plan.totalPayments}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs">Next Payment</span>
          </div>
          <CountdownBadge deadline={plan.nextDueDate} label="Next Payment" />
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-border bg-card p-5">
        <ProgressBar
          value={plan.paymentsMade}
          max={plan.totalPayments}
          label="Payment Plan Progress"
          variant={percentComplete >= 75 ? 'success' : percentComplete >= 50 ? 'warning' : 'default'}
        />
      </div>

      {/* Payment schedule */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Payment Schedule
        </h3>
        <div className="space-y-2">
          {plan.payments.map(payment => (
            <div
              key={payment.id}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2',
                payment.isPaid ? 'bg-success/5' : 'bg-background'
              )}
            >
              <div className="flex items-center gap-3">
                {payment.isPaid ? (
                  <CheckCircle2 className="h-5 w-5 text-success" aria-label="Paid" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" aria-label="Unpaid" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due{' '}
                    {new Date(payment.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {payment.isPaid && payment.paidDate && (
                <span className="text-xs text-success">
                  Paid{' '}
                  {new Date(payment.paidDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
