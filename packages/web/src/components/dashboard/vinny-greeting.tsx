'use client';

import { useState, useMemo } from 'react';
import { Bot, X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/use-accounts';
import { getTimeOfDay, getGreeting, generateContextualTip } from '@/lib/vinny/greeting-generator';

export function VinnyGreeting() {
  const [dismissed, setDismissed] = useState(false);
  const { accounts, summary } = useAccounts();

  const timeOfDay = getTimeOfDay();
  const greeting = getGreeting(timeOfDay);

  const tip = useMemo(
    () =>
      generateContextualTip({
        accounts,
        totalCurrentDebt: summary.totalCurrentDebt,
        totalOriginalDebt: summary.totalOriginalDebt,
        settledCount: summary.settledCount,
        disputedCount: summary.disputedCount,
        paymentPlanCount: summary.paymentPlanCount,
      }),
    [accounts, summary]
  );

  if (dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-5',
        'bg-gradient-to-r from-[hsl(var(--accent))]/5 to-transparent'
      )}
      role="complementary"
      aria-label="Vinny greeting"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss greeting"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex gap-4">
        {/* Vinny avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15">
          <Bot className="h-6 w-6 text-[hsl(var(--accent))]" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 pr-6">
          <h2 className="text-base font-semibold text-foreground">
            {greeting} <span className="text-[hsl(var(--accent))]">Vinny here.</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {tip}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => {
              console.log('[Vinny] Chat opened from greeting widget');
            }}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Chat with Vinny
          </Button>
        </div>
      </div>
    </div>
  );
}
