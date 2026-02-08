/**
 * Vinny greeting generator
 * Picks contextual tips based on time of day and account data
 */

import type { Account } from '@vindicate/shared';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function getGreeting(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'morning':
      return 'Good morning!';
    case 'afternoon':
      return 'Good afternoon!';
    case 'evening':
      return 'Good evening!';
  }
}

interface TipContext {
  accounts: Account[];
  totalCurrentDebt: number;
  totalOriginalDebt: number;
  settledCount: number;
  disputedCount: number;
  paymentPlanCount: number;
}

/**
 * Generate a contextual tip based on account data.
 * Returns an encouraging, relevant message.
 */
export function generateContextualTip(context: TipContext): string {
  const { accounts, totalCurrentDebt, totalOriginalDebt, settledCount, disputedCount, paymentPlanCount } = context;

  // Check for upcoming deadlines
  const accountsWithDeadlines = accounts.filter(a => a.statuteOfLimitationsDate);
  const nearestDeadline = accountsWithDeadlines
    .map(a => ({ account: a, date: new Date(a.statuteOfLimitationsDate!) }))
    .filter(a => a.date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  // Calculate progress
  const debtPaidOff = totalOriginalDebt - totalCurrentDebt;
  const percentPaid = totalOriginalDebt > 0 ? (debtPaidOff / totalOriginalDebt) * 100 : 0;

  // Pick the most relevant tip
  if (settledCount > 0 && percentPaid > 0) {
    return `You've already paid off ${Math.round(percentPaid)}% of your original debt. That's real progress! Keep going — every payment brings you closer to freedom.`;
  }

  if (paymentPlanCount > 0) {
    return "You're staying on top of your payment plan — that's building positive momentum. Consistent payments show creditors you're serious, and they'll help your credit score over time.";
  }

  if (disputedCount > 0) {
    return "Your active disputes are working for you. While the bureau investigates, collectors must pause collection efforts on those accounts. Stay patient — disputes take 30-45 days.";
  }

  if (nearestDeadline) {
    return `Remember to keep track of your statute of limitations dates. Knowledge of your legal timelines is one of your strongest tools.`;
  }

  return "Taking control of your finances is an act of courage. You've already taken the hardest step — getting started. I'm here whenever you need guidance.";
}
