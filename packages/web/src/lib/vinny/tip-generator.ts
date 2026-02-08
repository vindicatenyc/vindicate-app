/**
 * Vinny proactive tip generator
 * Generates contextual tips based on account data
 * Max 1 tip at a time
 */

import type { Account } from '@vindicate/shared';

export interface VinnyTip {
  id: string;
  text: string;
  chatPrompt: string; // What to send to Vinny if user clicks "Chat about this"
}

/**
 * Generate a dashboard-level tip based on overall account data
 */
export function generateDashboardTip(accounts: Account[]): VinnyTip | null {
  const now = new Date();

  // Check for upcoming deadlines first (highest priority)
  const upcomingDeadlines = accounts
    .filter((a) => a.statuteOfLimitationsDate)
    .map((a) => ({
      account: a,
      solDate: new Date(a.statuteOfLimitationsDate!),
    }))
    .filter((a) => {
      const daysUntil = Math.ceil(
        (a.solDate.getTime() - now.getTime()) / 86400000
      );
      return daysUntil > 0 && daysUntil <= 90;
    })
    .sort((a, b) => a.solDate.getTime() - b.solDate.getTime());

  if (upcomingDeadlines.length > 0) {
    const nearest = upcomingDeadlines[0];
    const daysUntil = Math.ceil(
      (nearest.solDate.getTime() - now.getTime()) / 86400000
    );
    return {
      id: `tip-sol-${nearest.account.id}`,
      text: `The statute of limitations on your ${nearest.account.creditorName} account expires in ${daysUntil} days. After that, they can no longer sue to collect. Don't restart the clock by making a payment!`,
      chatPrompt: 'Tell me about statute of limitations',
    };
  }

  // Check for accounts in collections without disputes
  const inCollections = accounts.filter(
    (a) => a.status === 'in-collections' && !a.caseIds.length
  );
  if (inCollections.length > 0) {
    return {
      id: `tip-validate-${inCollections[0].id}`,
      text: `You have ${inCollections.length} account${inCollections.length > 1 ? 's' : ''} in collections without an active dispute. Consider sending a debt validation letter — collectors must prove you owe the debt.`,
      chatPrompt: 'What is debt validation?',
    };
  }

  // General encouragement
  const paidOff = accounts.filter((a) =>
    ['settled', 'paid-in-full'].includes(a.status)
  );
  if (paidOff.length > 0) {
    return {
      id: 'tip-progress',
      text: `You've resolved ${paidOff.length} account${paidOff.length > 1 ? 's' : ''} so far. Every resolved debt is a step toward financial freedom. Keep up the great work!`,
      chatPrompt: 'What should I focus on next?',
    };
  }

  return {
    id: 'tip-general',
    text: 'Remember: knowledge is power when dealing with debt. Check out the Resource Center to learn about your rights under the FDCPA.',
    chatPrompt: 'Tell me about my rights',
  };
}

/**
 * Generate a tip specific to an individual account
 */
export function generateAccountTip(account: Account): VinnyTip | null {
  const now = new Date();

  // SOL status
  if (account.statuteOfLimitationsDate) {
    const solDate = new Date(account.statuteOfLimitationsDate);
    const daysUntil = Math.ceil(
      (solDate.getTime() - now.getTime()) / 86400000
    );

    if (daysUntil <= 0) {
      return {
        id: `tip-sol-expired-${account.id}`,
        text: `The statute of limitations on this account has expired. The collector can still try to collect, but they cannot sue you. Be careful not to restart the clock with a payment or written acknowledgment.`,
        chatPrompt: 'What is statute of limitations?',
      };
    }

    if (daysUntil <= 30) {
      return {
        id: `tip-sol-soon-${account.id}`,
        text: `Only ${daysUntil} days until the statute of limitations expires on this account. Hold tight and don't make any payments — you're almost in the clear for legal action.`,
        chatPrompt: 'Tell me about statute of limitations',
      };
    }
  }

  // Dispute suggestions
  if (account.status === 'in-collections' && account.caseIds.length === 0) {
    return {
      id: `tip-dispute-${account.id}`,
      text: `This account is in collections. Have you considered sending a debt validation letter? It forces the collector to prove you owe this debt — and they must pause collection while they do.`,
      chatPrompt: 'How do I validate a debt?',
    };
  }

  // Payment plan encouragement
  if (account.status === 'payment-plan') {
    return {
      id: `tip-payment-${account.id}`,
      text: `You're on a payment plan for this account — great move! Consistent payments build credibility and can help your credit score over time. Keep it up!`,
      chatPrompt: 'Will my payments improve my credit?',
    };
  }

  // Charged-off accounts
  if (account.status === 'charged-off') {
    return {
      id: `tip-chargeoff-${account.id}`,
      text: `This account is charged off, but you still owe the debt. You may be able to negotiate a settlement for 40-60% of the balance. Want to learn about settlement strategies?`,
      chatPrompt: 'How do I negotiate a settlement?',
    };
  }

  return null;
}
