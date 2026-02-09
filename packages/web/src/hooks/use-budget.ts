'use client';

/**
 * Custom hook for managing budget data — backed by Supabase
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Budget, IncomeEntry, ExpenseEntry, DebtPayment, SavingsGoal, ExpenseCategory } from '@vindicate/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { budgetFromRow, incomeFromRow, expenseFromRow, savingsGoalFromRow } from '@/lib/supabase/mappers';

export type NewIncomeEntry = Omit<IncomeEntry, 'id'>;
export type NewExpenseEntry = Omit<ExpenseEntry, 'id'>;
export type NewSavingsGoal = Omit<SavingsGoal, 'id' | 'createdAt'>;

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function recalculateTotals(income: IncomeEntry[], expenses: ExpenseEntry[]) {
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  return { totalIncome, totalExpenses, availableForDebt: totalIncome - totalExpenses };
}

export function useBudget() {
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    // Fetch budgets, income, expenses, and savings goals in parallel
    const [budgetRes, incomeRes, expenseRes, goalsRes] = await Promise.all([
      supabase.from('budgets').select('*').order('month', { ascending: false }),
      supabase.from('budget_income').select('*'),
      supabase.from('budget_expenses').select('*'),
      supabase.from('savings_goals').select('*').order('created_at', { ascending: false }),
    ]);

    if (budgetRes.error) { setError(budgetRes.error.message); setIsLoading(false); return; }

    const incomeByBudget = new Map<string, typeof incomeRes.data>();
    for (const row of incomeRes.data ?? []) {
      const list = incomeByBudget.get(row.budget_id) ?? [];
      list.push(row);
      incomeByBudget.set(row.budget_id, list);
    }

    const expenseByBudget = new Map<string, typeof expenseRes.data>();
    for (const row of expenseRes.data ?? []) {
      const list = expenseByBudget.get(row.budget_id) ?? [];
      list.push(row);
      expenseByBudget.set(row.budget_id, list);
    }

    const mapped = (budgetRes.data ?? []).map((bRow: Record<string, unknown>) => {
      const budgetId = bRow.id as string;
      return budgetFromRow(
        bRow,
        incomeByBudget.get(budgetId) ?? [],
        expenseByBudget.get(budgetId) ?? []
      );
    });

    setBudgets(mapped);
    setSavingsGoals((goalsRes.data ?? []).map(savingsGoalFromRow));
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const currentBudget = useMemo(() => {
    const currentMonth = getCurrentMonthKey();
    return budgets.find(b => b.month === currentMonth);
  }, [budgets]);

  const getBudgetByMonth = useCallback((month: string): Budget | undefined => {
    return budgets.find(b => b.month === month);
  }, [budgets]);

  const createBudget = useCallback(async (month: string, copyFromPrevious: boolean = true): Promise<Budget | null> => {
    if (!user) return null;
    const existing = budgets.find(b => b.month === month);
    if (existing) return existing;

    const { data, error: insertError } = await supabase
      .from('budgets')
      .insert({ user_id: user.id, month, repayment_strategy: 'snowball' })
      .select()
      .single();
    if (insertError) { setError(insertError.message); return null; }

    // If copying from previous, duplicate recurring entries
    if (copyFromPrevious && budgets.length > 0) {
      const sorted = [...budgets].sort((a, b) => b.month.localeCompare(a.month));
      const template = sorted[0];

      const recurringIncome = template.income.filter(i => i.isRecurring);
      const recurringExpenses = template.expenses.filter(e => e.isRecurring);

      if (recurringIncome.length > 0) {
        await supabase.from('budget_income').insert(
          recurringIncome.map(i => ({ user_id: user.id, budget_id: data.id, source: i.source, amount: i.amount, frequency: i.frequency, is_recurring: true }))
        );
      }
      if (recurringExpenses.length > 0) {
        await supabase.from('budget_expenses').insert(
          recurringExpenses.map(e => ({ user_id: user.id, budget_id: data.id, category: e.category, name: e.name, amount: e.amount, is_fixed: e.isFixed, is_recurring: true }))
        );
      }
    }

    await fetchBudgets();
    return budgets.find(b => b.month === month) ?? null;
  }, [user, supabase, budgets, fetchBudgets]);

  const addIncome = useCallback(async (month: string, income: NewIncomeEntry): Promise<IncomeEntry | null> => {
    if (!user) return null;
    const budget = budgets.find(b => b.month === month);
    if (!budget) return null;

    const { data, error: insertError } = await supabase
      .from('budget_income')
      .insert({ user_id: user.id, budget_id: budget.id, source: income.source, amount: income.amount, frequency: income.frequency, is_recurring: income.isRecurring })
      .select()
      .single();
    if (insertError) { setError(insertError.message); return null; }

    const entry = incomeFromRow(data);
    const newIncome = [...budget.income, entry];
    const totals = recalculateTotals(newIncome, budget.expenses);

    await supabase.from('budgets').update({ total_income: totals.totalIncome, total_expenses: totals.totalExpenses, available_for_debt: totals.availableForDebt }).eq('id', budget.id);
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, income: newIncome, ...totals } : b));
    return entry;
  }, [user, supabase, budgets]);

  const updateIncome = useCallback(async (month: string, incomeId: string, updates: Partial<IncomeEntry>): Promise<void> => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return;

    const row: Record<string, unknown> = {};
    if (updates.source !== undefined) row.source = updates.source;
    if (updates.amount !== undefined) row.amount = updates.amount;
    if (updates.frequency !== undefined) row.frequency = updates.frequency;
    if (updates.isRecurring !== undefined) row.is_recurring = updates.isRecurring;

    await supabase.from('budget_income').update(row).eq('id', incomeId);
    const newIncome = budget.income.map(i => i.id === incomeId ? { ...i, ...updates } : i);
    const totals = recalculateTotals(newIncome, budget.expenses);
    await supabase.from('budgets').update({ total_income: totals.totalIncome, total_expenses: totals.totalExpenses, available_for_debt: totals.availableForDebt }).eq('id', budget.id);
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, income: newIncome, ...totals } : b));
  }, [supabase, budgets]);

  const deleteIncome = useCallback(async (month: string, incomeId: string): Promise<void> => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return;
    await supabase.from('budget_income').delete().eq('id', incomeId);
    const newIncome = budget.income.filter(i => i.id !== incomeId);
    const totals = recalculateTotals(newIncome, budget.expenses);
    await supabase.from('budgets').update({ total_income: totals.totalIncome, total_expenses: totals.totalExpenses, available_for_debt: totals.availableForDebt }).eq('id', budget.id);
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, income: newIncome, ...totals } : b));
  }, [supabase, budgets]);

  const addExpense = useCallback(async (month: string, expense: NewExpenseEntry): Promise<ExpenseEntry | null> => {
    if (!user) return null;
    const budget = budgets.find(b => b.month === month);
    if (!budget) return null;

    const { data, error: insertError } = await supabase
      .from('budget_expenses')
      .insert({ user_id: user.id, budget_id: budget.id, category: expense.category, name: expense.name, amount: expense.amount, is_fixed: expense.isFixed, is_recurring: expense.isRecurring })
      .select()
      .single();
    if (insertError) { setError(insertError.message); return null; }

    const entry = expenseFromRow(data);
    const newExpenses = [...budget.expenses, entry];
    const totals = recalculateTotals(budget.income, newExpenses);
    await supabase.from('budgets').update({ total_income: totals.totalIncome, total_expenses: totals.totalExpenses, available_for_debt: totals.availableForDebt }).eq('id', budget.id);
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, expenses: newExpenses, ...totals } : b));
    return entry;
  }, [user, supabase, budgets]);

  const updateExpense = useCallback(async (month: string, expenseId: string, updates: Partial<ExpenseEntry>): Promise<void> => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return;

    const row: Record<string, unknown> = {};
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.amount !== undefined) row.amount = updates.amount;
    if (updates.isFixed !== undefined) row.is_fixed = updates.isFixed;
    if (updates.isRecurring !== undefined) row.is_recurring = updates.isRecurring;

    await supabase.from('budget_expenses').update(row).eq('id', expenseId);
    const newExpenses = budget.expenses.map(e => e.id === expenseId ? { ...e, ...updates } : e);
    const totals = recalculateTotals(budget.income, newExpenses);
    await supabase.from('budgets').update({ total_income: totals.totalIncome, total_expenses: totals.totalExpenses, available_for_debt: totals.availableForDebt }).eq('id', budget.id);
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, expenses: newExpenses, ...totals } : b));
  }, [supabase, budgets]);

  const deleteExpense = useCallback(async (month: string, expenseId: string): Promise<void> => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return;
    await supabase.from('budget_expenses').delete().eq('id', expenseId);
    const newExpenses = budget.expenses.filter(e => e.id !== expenseId);
    const totals = recalculateTotals(budget.income, newExpenses);
    await supabase.from('budgets').update({ total_income: totals.totalIncome, total_expenses: totals.totalExpenses, available_for_debt: totals.availableForDebt }).eq('id', budget.id);
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, expenses: newExpenses, ...totals } : b));
  }, [supabase, budgets]);

  const updateDebtPayment = useCallback(async (month: string, accountId: string, payment: Partial<DebtPayment>): Promise<void> => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return;
    const existingIndex = budget.debtPayments.findIndex(p => p.accountId === accountId);
    let newDebtPayments: DebtPayment[];
    if (existingIndex >= 0) {
      newDebtPayments = budget.debtPayments.map((p, i) => i === existingIndex ? { ...p, ...payment } : p);
    } else {
      newDebtPayments = [...budget.debtPayments, { accountId, allocatedAmount: 0, isPaid: false, ...payment }];
    }
    await supabase.from('budgets').update({ debt_payments: newDebtPayments }).eq('id', budget.id);
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, debtPayments: newDebtPayments } : b));
  }, [supabase, budgets]);

  const setRepaymentStrategy = useCallback(async (month: string, strategy: Budget['repaymentStrategy']): Promise<void> => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return;
    await supabase.from('budgets').update({ repayment_strategy: strategy }).eq('id', budget.id);
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, repaymentStrategy: strategy } : b));
  }, [supabase, budgets]);

  const addSavingsGoal = useCallback(async (goal: NewSavingsGoal): Promise<SavingsGoal | null> => {
    if (!user) return null;
    const { data, error: insertError } = await supabase
      .from('savings_goals')
      .insert({ user_id: user.id, name: goal.name, target_amount: goal.targetAmount, current_amount: goal.currentAmount, monthly_contribution: goal.monthlyContribution, target_date: goal.targetDate ?? null })
      .select()
      .single();
    if (insertError) { setError(insertError.message); return null; }
    const sg = savingsGoalFromRow(data);
    setSavingsGoals(prev => [sg, ...prev]);
    return sg;
  }, [user, supabase]);

  const updateSavingsGoal = useCallback(async (goalId: string, updates: Partial<SavingsGoal>): Promise<void> => {
    const row: Record<string, unknown> = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.targetAmount !== undefined) row.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) row.current_amount = updates.currentAmount;
    if (updates.monthlyContribution !== undefined) row.monthly_contribution = updates.monthlyContribution;
    if (updates.targetDate !== undefined) row.target_date = updates.targetDate ?? null;
    await supabase.from('savings_goals').update(row).eq('id', goalId);
    setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
  }, [supabase]);

  const deleteSavingsGoal = useCallback(async (goalId: string): Promise<void> => {
    await supabase.from('savings_goals').delete().eq('id', goalId);
    setSavingsGoals(prev => prev.filter(g => g.id !== goalId));
  }, [supabase]);

  const getExpensesByCategory = useCallback((month: string): Record<ExpenseCategory, number> => {
    const budget = budgets.find(b => b.month === month);
    if (!budget) return {} as Record<ExpenseCategory, number>;
    return budget.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);
  }, [budgets]);

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
      savingsRate: budget.totalIncome > 0 ? ((budget.availableForDebt - debtPaymentsTotal) / budget.totalIncome * 100).toFixed(1) : '0',
    };
  }, [budgets]);

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
    budgets, currentBudget, savingsGoals, isLoading, error, stats,
    getBudgetByMonth, createBudget,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    updateDebtPayment, setRepaymentStrategy,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    getExpensesByCategory, getBudgetSummary,
  };
}
