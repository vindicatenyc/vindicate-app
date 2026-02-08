'use client';

/**
 * Custom hook for managing budget data
 * Provides access to budget, income, expenses, and savings goals
 */

import { useState, useCallback, useMemo } from 'react';
import type { Budget, IncomeEntry, ExpenseEntry, DebtPayment, SavingsGoal, ExpenseCategory } from '@vindicate/shared';
import { mockBudgets as initialBudgets, mockSavingsGoals as initialGoals } from '@/lib/mock-data';

export type NewIncomeEntry = Omit<IncomeEntry, 'id'>;
export type NewExpenseEntry = Omit<ExpenseEntry, 'id'>;
export type NewSavingsGoal = Omit<SavingsGoal, 'id' | 'createdAt'>;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function recalculateBudget(budget: Budget): Budget {
  const totalIncome = budget.income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = budget.expenses.reduce((sum, e) => sum + e.amount, 0);
  const debtPaymentsTotal = budget.debtPayments.reduce((sum, p) => sum + p.allocatedAmount, 0);

  return {
    ...budget,
    totalIncome,
    totalExpenses,
    availableForDebt: totalIncome - totalExpenses,
    updatedAt: new Date().toISOString(),
  };
}

export function useBudget() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(initialGoals);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current month's budget
  const currentBudget = useMemo(() => {
    const currentMonth = getCurrentMonthKey();
    return budgets.find(b => b.month === currentMonth);
  }, [budgets]);

  // Get budget by month
  const getBudgetByMonth = useCallback((month: string): Budget | undefined => {
    return budgets.find(b => b.month === month);
  }, [budgets]);

  // Create a new budget for a month
  const createBudget = useCallback((
    month: string,
    copyFromPrevious: boolean = true
  ): Budget => {
    const now = new Date().toISOString();
    const existingBudget = budgets.find(b => b.month === month);
    if (existingBudget) return existingBudget;

    // Find the most recent budget to copy from
    let template: Budget | undefined;
    if (copyFromPrevious && budgets.length > 0) {
      const sorted = [...budgets].sort((a, b) => b.month.localeCompare(a.month));
      template = sorted[0];
    }

    const newBudget: Budget = {
      id: generateId('budget'),
      month,
      income: template?.income.filter(i => i.isRecurring).map(i => ({
        ...i,
        id: generateId('inc'),
      })) || [],
      expenses: template?.expenses.filter(e => e.isRecurring).map(e => ({
        ...e,
        id: generateId('exp'),
      })) || [],
      totalIncome: 0,
      totalExpenses: 0,
      availableForDebt: 0,
      debtPayments: [],
      repaymentStrategy: template?.repaymentStrategy || 'snowball',
      createdAt: now,
      updatedAt: now,
    };

    const calculated = recalculateBudget(newBudget);
    setBudgets(prev => [...prev, calculated]);
    return calculated;
  }, [budgets]);

  // Add income entry to a budget
  const addIncome = useCallback((month: string, income: NewIncomeEntry): IncomeEntry | null => {
    const entry: IncomeEntry = {
      ...income,
      id: generateId('inc'),
    };

    let added = false;
    setBudgets(prev =>
      prev.map(budget => {
        if (budget.month === month) {
          added = true;
          const updated = {
            ...budget,
            income: [...budget.income, entry],
          };
          return recalculateBudget(updated);
        }
        return budget;
      })
    );

    return added ? entry : null;
  }, []);

  // Update income entry
  const updateIncome = useCallback((
    month: string,
    incomeId: string,
    updates: Partial<IncomeEntry>
  ): void => {
    setBudgets(prev =>
      prev.map(budget => {
        if (budget.month === month) {
          const updated = {
            ...budget,
            income: budget.income.map(i =>
              i.id === incomeId ? { ...i, ...updates } : i
            ),
          };
          return recalculateBudget(updated);
        }
        return budget;
      })
    );
  }, []);

  // Delete income entry
  const deleteIncome = useCallback((month: string, incomeId: string): void => {
    setBudgets(prev =>
      prev.map(budget => {
        if (budget.month === month) {
          const updated = {
            ...budget,
            income: budget.income.filter(i => i.id !== incomeId),
          };
          return recalculateBudget(updated);
        }
        return budget;
      })
    );
  }, []);

  // Add expense entry to a budget
  const addExpense = useCallback((month: string, expense: NewExpenseEntry): ExpenseEntry | null => {
    const entry: ExpenseEntry = {
      ...expense,
      id: generateId('exp'),
    };

    let added = false;
    setBudgets(prev =>
      prev.map(budget => {
        if (budget.month === month) {
          added = true;
          const updated = {
            ...budget,
            expenses: [...budget.expenses, entry],
          };
          return recalculateBudget(updated);
        }
        return budget;
      })
    );

    return added ? entry : null;
  }, []);

  // Update expense entry
  const updateExpense = useCallback((
    month: string,
    expenseId: string,
    updates: Partial<ExpenseEntry>
  ): void => {
    setBudgets(prev =>
      prev.map(budget => {
        if (budget.month === month) {
          const updated = {
            ...budget,
            expenses: budget.expenses.map(e =>
              e.id === expenseId ? { ...e, ...updates } : e
            ),
          };
          return recalculateBudget(updated);
        }
        return budget;
      })
    );
  }, []);

  // Delete expense entry
  const deleteExpense = useCallback((month: string, expenseId: string): void => {
    setBudgets(prev =>
      prev.map(budget => {
        if (budget.month === month) {
          const updated = {
            ...budget,
            expenses: budget.expenses.filter(e => e.id !== expenseId),
          };
          return recalculateBudget(updated);
        }
        return budget;
      })
    );
  }, []);

  // Update debt payment
  const updateDebtPayment = useCallback((
    month: string,
    accountId: string,
    payment: Partial<DebtPayment>
  ): void => {
    setBudgets(prev =>
      prev.map(budget => {
        if (budget.month === month) {
          const existingIndex = budget.debtPayments.findIndex(p => p.accountId === accountId);

          let newDebtPayments: DebtPayment[];
          if (existingIndex >= 0) {
            newDebtPayments = budget.debtPayments.map((p, i) =>
              i === existingIndex ? { ...p, ...payment } : p
            );
          } else {
            newDebtPayments = [
              ...budget.debtPayments,
              { accountId, allocatedAmount: 0, isPaid: false, ...payment },
            ];
          }

          return {
            ...budget,
            debtPayments: newDebtPayments,
            updatedAt: new Date().toISOString(),
          };
        }
        return budget;
      })
    );
  }, []);

  // Set repayment strategy
  const setRepaymentStrategy = useCallback((
    month: string,
    strategy: Budget['repaymentStrategy']
  ): void => {
    setBudgets(prev =>
      prev.map(budget => {
        if (budget.month === month) {
          return {
            ...budget,
            repaymentStrategy: strategy,
            updatedAt: new Date().toISOString(),
          };
        }
        return budget;
      })
    );
  }, []);

  // Add savings goal
  const addSavingsGoal = useCallback((goal: NewSavingsGoal): SavingsGoal => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: generateId('goal'),
      createdAt: new Date().toISOString(),
    };

    setSavingsGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, []);

  // Update savings goal
  const updateSavingsGoal = useCallback((
    goalId: string,
    updates: Partial<SavingsGoal>
  ): void => {
    setSavingsGoals(prev =>
      prev.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      )
    );
  }, []);

  // Delete savings goal
  const deleteSavingsGoal = useCallback((goalId: string): void => {
    setSavingsGoals(prev => prev.filter(goal => goal.id !== goalId));
  }, []);

  // Get expenses by category for a month
  const getExpensesByCategory = useCallback((month: string): Record<ExpenseCategory, number> => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return {} as Record<ExpenseCategory, number>;

    return budget.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);
  }, [budgets]);

  // Get budget summary
  const getBudgetSummary = useCallback((month: string) => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return null;

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
      savingsRate: budget.totalIncome > 0
        ? ((budget.availableForDebt - debtPaymentsTotal) / budget.totalIncome * 100).toFixed(1)
        : '0',
    };
  }, [budgets]);

  // Computed stats
  const stats = useMemo(() => {
    if (!currentBudget) return null;

    const summary = getBudgetSummary(currentBudget.month);
    return {
      ...summary,
      savingsGoalsTotal: savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0),
      savingsGoalsTarget: savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0),
      monthlyContributions: savingsGoals.reduce((sum, g) => sum + g.monthlyContribution, 0),
    };
  }, [currentBudget, savingsGoals, getBudgetSummary]);

  return {
    budgets,
    currentBudget,
    savingsGoals,
    isLoading,
    error,
    stats,
    getBudgetByMonth,
    createBudget,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    updateDebtPayment,
    setRepaymentStrategy,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    getExpensesByCategory,
    getBudgetSummary,
  };
}
