/**
 * Debt repayment calculator
 * Snowball (smallest balance first) and Avalanche (highest rate first) strategies
 */

import type { Account } from '@vindicate/shared';

export type DebtStrategy = 'snowball' | 'avalanche';

export interface DebtAccountInfo {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  isFocus: boolean;
}

export interface DebtCalculationResult {
  accounts: DebtAccountInfo[];
  totalBalance: number;
  totalMinimumPayments: number;
  estimatedMonthsToPayoff: number;
  totalInterest: number;
}

/**
 * Sort accounts by snowball strategy (smallest balance first)
 */
export function sortBySnowball(accounts: DebtAccountInfo[]): DebtAccountInfo[] {
  return [...accounts].sort((a, b) => a.balance - b.balance);
}

/**
 * Sort accounts by avalanche strategy (highest interest rate first)
 */
export function sortByAvalanche(accounts: DebtAccountInfo[]): DebtAccountInfo[] {
  return [...accounts].sort((a, b) => b.interestRate - a.interestRate);
}

/**
 * Calculate estimated months to payoff given a monthly payment amount
 * Uses a simplified amortization formula
 */
export function calculateMonthsToPayoff(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): number {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;

  const monthlyRate = annualRate / 100 / 12;

  // No interest
  if (monthlyRate === 0) {
    return Math.ceil(balance / monthlyPayment);
  }

  // Monthly interest exceeds payment — never pays off
  const monthlyInterest = balance * monthlyRate;
  if (monthlyPayment <= monthlyInterest) {
    return Infinity;
  }

  // Standard amortization: n = -log(1 - (r * P) / M) / log(1 + r)
  const months = -Math.log(1 - (monthlyRate * balance) / monthlyPayment) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}

/**
 * Calculate total interest paid over the repayment period
 */
export function calculateTotalInterest(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): number {
  if (balance <= 0 || monthlyPayment <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600; // Cap at 50 years

  while (remaining > 0 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    const principal = Math.min(monthlyPayment - interest, remaining);
    if (principal <= 0) break; // Can never pay off
    remaining -= principal;
    months++;
  }

  return Math.round(totalInterest);
}

/**
 * Convert Account objects to DebtAccountInfo for calculation
 * Only includes accounts with a positive current balance
 */
export function accountsToDebtInfo(accounts: Account[]): DebtAccountInfo[] {
  return accounts
    .filter(a => a.currentBalance > 0 && a.status !== 'paid-in-full' && a.status !== 'settled')
    .map(a => ({
      id: a.id,
      name: a.collectorName || a.creditorName,
      balance: a.currentBalance,
      interestRate: a.interestRate ?? 0,
      minimumPayment: a.minimumPayment ?? 25,
      isFocus: false,
    }));
}

/**
 * Calculate full debt repayment plan for a given strategy and monthly payment
 */
export function calculateDebtPlan(
  accounts: DebtAccountInfo[],
  strategy: DebtStrategy,
  availableMonthlyPayment: number
): DebtCalculationResult {
  if (accounts.length === 0) {
    return {
      accounts: [],
      totalBalance: 0,
      totalMinimumPayments: 0,
      estimatedMonthsToPayoff: 0,
      totalInterest: 0,
    };
  }

  // Sort by strategy
  const sorted = strategy === 'snowball'
    ? sortBySnowball(accounts)
    : sortByAvalanche(accounts);

  // Mark the first account as focus
  const withFocus = sorted.map((a, i) => ({
    ...a,
    isFocus: i === 0,
  }));

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalMinimumPayments = accounts.reduce((sum, a) => sum + a.minimumPayment, 0);

  // Calculate total interest for each strategy
  // Simplified: distribute extra payment to focus account
  const extraPayment = Math.max(0, availableMonthlyPayment - totalMinimumPayments);
  let totalInterest = 0;
  let maxMonths = 0;

  for (const account of withFocus) {
    const payment = account.minimumPayment + (account.isFocus ? extraPayment : 0);
    const months = calculateMonthsToPayoff(account.balance, account.interestRate, payment);
    const interest = calculateTotalInterest(account.balance, account.interestRate, payment);
    totalInterest += interest;
    if (months > maxMonths && months !== Infinity) maxMonths = months;
  }

  return {
    accounts: withFocus,
    totalBalance,
    totalMinimumPayments,
    estimatedMonthsToPayoff: maxMonths,
    totalInterest,
  };
}
