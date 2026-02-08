/**
 * Mock budget data for Maria
 * 2-3 months of budget data with realistic NYC expenses
 */

import type { Budget, SavingsGoal } from '@vindicate/shared';
import { ACCOUNT_IDS } from './accounts';

export const mockBudgets: Budget[] = [
  // February 2026 - Current month
  {
    id: 'budget-2026-02',
    month: '2026-02',
    income: [
      {
        id: 'inc-001',
        source: 'Salary (Administrative Assistant)',
        amount: 3800,
        frequency: 'monthly',
        isRecurring: true,
      },
      {
        id: 'inc-002',
        source: 'Freelance Data Entry',
        amount: 400,
        frequency: 'monthly',
        isRecurring: false,
      },
    ],
    expenses: [
      {
        id: 'exp-001',
        category: 'housing',
        name: 'Rent (1BR in Astoria)',
        amount: 1850,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-002',
        category: 'utilities',
        name: 'ConEd Electric',
        amount: 95,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-003',
        category: 'utilities',
        name: 'National Grid Gas',
        amount: 45,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-004',
        category: 'utilities',
        name: 'Spectrum Internet',
        amount: 55,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-005',
        category: 'utilities',
        name: 'T-Mobile Phone',
        amount: 65,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-006',
        category: 'food',
        name: 'Groceries',
        amount: 350,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-007',
        category: 'food',
        name: 'Dining/Takeout',
        amount: 80,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-008',
        category: 'transportation',
        name: 'MTA MetroCard',
        amount: 132,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-009',
        category: 'healthcare',
        name: 'Health Insurance (Employer)',
        amount: 180,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-010',
        category: 'healthcare',
        name: 'Medications',
        amount: 45,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-011',
        category: 'insurance',
        name: "Renter's Insurance",
        amount: 25,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-012',
        category: 'personal',
        name: 'Personal Care/Toiletries',
        amount: 40,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-013',
        category: 'personal',
        name: 'Streaming (Netflix, Spotify)',
        amount: 28,
        isFixed: true,
        isRecurring: true,
      },
    ],
    totalIncome: 4200,
    totalExpenses: 2990,
    availableForDebt: 1210,
    debtPayments: [
      {
        accountId: ACCOUNT_IDS.capitalOne,
        allocatedAmount: 175,
        isPaid: true,
        paidDate: '2026-02-01',
      },
      {
        accountId: ACCOUNT_IDS.mtSinaiMedical,
        allocatedAmount: 100,
        isPaid: false,
      },
    ],
    repaymentStrategy: 'snowball',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T09:30:00Z',
  },

  // January 2026
  {
    id: 'budget-2026-01',
    month: '2026-01',
    income: [
      {
        id: 'inc-003',
        source: 'Salary (Administrative Assistant)',
        amount: 3800,
        frequency: 'monthly',
        isRecurring: true,
      },
      {
        id: 'inc-004',
        source: 'Holiday Bonus',
        amount: 500,
        frequency: 'one-time',
        isRecurring: false,
      },
    ],
    expenses: [
      {
        id: 'exp-014',
        category: 'housing',
        name: 'Rent (1BR in Astoria)',
        amount: 1850,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-015',
        category: 'utilities',
        name: 'ConEd Electric',
        amount: 110,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-016',
        category: 'utilities',
        name: 'National Grid Gas',
        amount: 65,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-017',
        category: 'utilities',
        name: 'Spectrum Internet',
        amount: 55,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-018',
        category: 'utilities',
        name: 'T-Mobile Phone',
        amount: 65,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-019',
        category: 'food',
        name: 'Groceries',
        amount: 380,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-020',
        category: 'food',
        name: 'Dining/Takeout',
        amount: 100,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-021',
        category: 'transportation',
        name: 'MTA MetroCard',
        amount: 132,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-022',
        category: 'healthcare',
        name: 'Health Insurance (Employer)',
        amount: 180,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-023',
        category: 'healthcare',
        name: 'Medications',
        amount: 45,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-024',
        category: 'insurance',
        name: "Renter's Insurance",
        amount: 25,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-025',
        category: 'personal',
        name: 'Personal Care/Toiletries',
        amount: 50,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-026',
        category: 'personal',
        name: 'Streaming (Netflix, Spotify)',
        amount: 28,
        isFixed: true,
        isRecurring: true,
      },
    ],
    totalIncome: 4300,
    totalExpenses: 3085,
    availableForDebt: 1215,
    debtPayments: [
      {
        accountId: ACCOUNT_IDS.capitalOne,
        allocatedAmount: 175,
        isPaid: true,
        paidDate: '2026-01-01',
      },
    ],
    repaymentStrategy: 'snowball',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-31T23:59:00Z',
  },

  // December 2025
  {
    id: 'budget-2025-12',
    month: '2025-12',
    income: [
      {
        id: 'inc-005',
        source: 'Salary (Administrative Assistant)',
        amount: 3800,
        frequency: 'monthly',
        isRecurring: true,
      },
      {
        id: 'inc-006',
        source: 'Freelance Data Entry',
        amount: 300,
        frequency: 'monthly',
        isRecurring: false,
      },
    ],
    expenses: [
      {
        id: 'exp-027',
        category: 'housing',
        name: 'Rent (1BR in Astoria)',
        amount: 1850,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-028',
        category: 'utilities',
        name: 'ConEd Electric',
        amount: 85,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-029',
        category: 'utilities',
        name: 'National Grid Gas',
        amount: 55,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-030',
        category: 'utilities',
        name: 'Spectrum Internet',
        amount: 55,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-031',
        category: 'utilities',
        name: 'T-Mobile Phone',
        amount: 65,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-032',
        category: 'food',
        name: 'Groceries',
        amount: 400,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-033',
        category: 'food',
        name: 'Dining/Takeout',
        amount: 120,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-034',
        category: 'transportation',
        name: 'MTA MetroCard',
        amount: 132,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-035',
        category: 'healthcare',
        name: 'Health Insurance (Employer)',
        amount: 180,
        isFixed: true,
        isRecurring: true,
      },
      {
        id: 'exp-036',
        category: 'healthcare',
        name: 'Medications',
        amount: 45,
        isFixed: false,
        isRecurring: true,
      },
      {
        id: 'exp-037',
        category: 'personal',
        name: 'Holiday Gifts',
        amount: 150,
        isFixed: false,
        isRecurring: false,
      },
      {
        id: 'exp-038',
        category: 'personal',
        name: 'Streaming (Netflix, Spotify)',
        amount: 28,
        isFixed: true,
        isRecurring: true,
      },
    ],
    totalIncome: 4100,
    totalExpenses: 3165,
    availableForDebt: 935,
    debtPayments: [
      {
        accountId: ACCOUNT_IDS.capitalOne,
        allocatedAmount: 175,
        isPaid: true,
        paidDate: '2025-12-01',
      },
      {
        accountId: ACCOUNT_IDS.conEdison,
        allocatedAmount: 534,
        isPaid: true,
        paidDate: '2025-12-20',
      },
    ],
    repaymentStrategy: 'snowball',
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-31T23:59:00Z',
  },
];

// Savings Goals
export const mockSavingsGoals: SavingsGoal[] = [
  {
    id: 'goal-001',
    name: 'Emergency Fund',
    targetAmount: 3000,
    currentAmount: 450,
    monthlyContribution: 100,
    targetDate: '2026-12-31',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'goal-002',
    name: 'Settlement Fund',
    targetAmount: 5000,
    currentAmount: 200,
    monthlyContribution: 150,
    targetDate: '2027-06-30',
    createdAt: '2026-01-15T00:00:00Z',
  },
];

// Helper functions
export function getCurrentBudget(): Budget | undefined {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return mockBudgets.find(b => b.month === currentMonth);
}

export function getBudgetByMonth(month: string): Budget | undefined {
  return mockBudgets.find(b => b.month === month);
}

export function getBudgetSummary(budget: Budget) {
  const fixed = budget.expenses.filter(e => e.isFixed).reduce((sum, e) => sum + e.amount, 0);
  const variable = budget.expenses.filter(e => !e.isFixed).reduce((sum, e) => sum + e.amount, 0);
  const debtPaymentsTotal = budget.debtPayments.reduce((sum, p) => sum + p.allocatedAmount, 0);

  return {
    totalIncome: budget.totalIncome,
    fixedExpenses: fixed,
    variableExpenses: variable,
    totalExpenses: budget.totalExpenses,
    debtPayments: debtPaymentsTotal,
    remaining: budget.totalIncome - budget.totalExpenses - debtPaymentsTotal,
    savingsRate: ((budget.availableForDebt - debtPaymentsTotal) / budget.totalIncome * 100).toFixed(1),
  };
}

export function getExpensesByCategory(budget: Budget) {
  const byCategory: Record<string, number> = {};
  for (const expense of budget.expenses) {
    byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
  }
  return byCategory;
}
