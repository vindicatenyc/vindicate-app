/**
 * Mock credit score data for Maria
 * Score of 580 with 6-month upward trend history
 */

import type { CreditScore, CreditFactor, CreditScoreEntry, CreditRating } from '@vindicate/shared';

// 6-month history showing gradual improvement
export const mockCreditScoreHistory: CreditScoreEntry[] = [
  { score: 545, date: '2025-09-01' },
  { score: 552, date: '2025-10-01' },
  { score: 558, date: '2025-11-01' },
  { score: 565, date: '2025-12-01' },
  { score: 572, date: '2026-01-01' },
  { score: 580, date: '2026-02-01' },
];

// Credit factors affecting Maria's score
export const mockCreditFactors: CreditFactor[] = [
  {
    name: 'Payment History',
    impact: 'high',
    status: 'negative',
    description: 'You have 4 accounts with late payments in the past 24 months. Making on-time payments going forward will help this factor improve over time.',
  },
  {
    name: 'Credit Utilization',
    impact: 'high',
    status: 'negative',
    description: 'Your credit utilization is very high. The one active card (Chase) has a low balance, but closed accounts with balances hurt this score.',
  },
  {
    name: 'Derogatory Marks',
    impact: 'high',
    status: 'negative',
    description: 'You have 3 accounts in collections and 2 charge-offs. These stay on your report for 7 years but their impact decreases over time.',
  },
  {
    name: 'Age of Credit History',
    impact: 'medium',
    status: 'neutral',
    description: 'Your oldest account is 6 years old (Chase). This is a moderately positive factor. Keep your oldest accounts open if possible.',
  },
  {
    name: 'Total Accounts',
    impact: 'low',
    status: 'neutral',
    description: 'You have 8 total accounts. This is a reasonable number. Having a mix of credit types can help.',
  },
  {
    name: 'Recent Inquiries',
    impact: 'low',
    status: 'positive',
    description: 'You have no recent hard inquiries. This is good - avoid applying for new credit while rebuilding.',
  },
];

// Current credit score
export const mockCreditScore: CreditScore = {
  score: 580,
  rating: 'fair',
  date: '2026-02-01',
  source: 'Mock (Based on VantageScore 3.0)',
  factors: mockCreditFactors,
  history: mockCreditScoreHistory,
};

// Helper functions
export function getCreditRating(score: number): CreditRating {
  if (score >= 800) return 'excellent';
  if (score >= 740) return 'very-good';
  if (score >= 670) return 'good';
  if (score >= 580) return 'fair';
  return 'poor';
}

export function getScoreChange(): { change: number; direction: 'up' | 'down' | 'same' } {
  const history = mockCreditScoreHistory;
  if (history.length < 2) return { change: 0, direction: 'same' };

  const current = history[history.length - 1].score;
  const previous = history[history.length - 2].score;
  const change = current - previous;

  return {
    change: Math.abs(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
  };
}

export function getTotalImprovement(): number {
  const history = mockCreditScoreHistory;
  if (history.length < 2) return 0;
  return history[history.length - 1].score - history[0].score;
}

export function getPositiveFactors(): CreditFactor[] {
  return mockCreditFactors.filter(f => f.status === 'positive');
}

export function getNegativeFactors(): CreditFactor[] {
  return mockCreditFactors.filter(f => f.status === 'negative');
}

export function getHighImpactFactors(): CreditFactor[] {
  return mockCreditFactors.filter(f => f.impact === 'high');
}

// Simulate score impact predictions
export function predictScoreImpact(action: 'payoff_account' | 'dispute_resolved' | 'payment_plan_completion'): number {
  switch (action) {
    case 'payoff_account':
      return Math.floor(Math.random() * 15) + 10; // 10-25 points
    case 'dispute_resolved':
      return Math.floor(Math.random() * 25) + 15; // 15-40 points
    case 'payment_plan_completion':
      return Math.floor(Math.random() * 20) + 20; // 20-40 points
    default:
      return 0;
  }
}
