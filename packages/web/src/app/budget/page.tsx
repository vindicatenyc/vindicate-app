'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fadeIn } from '@/lib/animations';
import { PageHeader } from '@/components/ui/page-header';
import { useBudget } from '@/hooks/use-budget';
import { useCreditScore } from '@/hooks/use-credit-score';
import {
  BudgetOverview,
  IncomeSection,
  ExpenseSection,
  BudgetBar,
  DebtTracker,
  CreditScoreCard,
  CreditFactors,
  SavingsGoals,
} from '@/components/budget';
import type { DebtStrategy } from '@/lib/utils/debt-calculator';

const SpendingChart = dynamic(
  () => import('@/components/budget/spending-chart').then(mod => ({ default: mod.SpendingChart })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted" /> }
);

const TrendChart = dynamic(
  () => import('@/components/budget/trend-chart').then(mod => ({ default: mod.TrendChart })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted" /> }
);

const ScoreTrend = dynamic(
  () => import('@/components/budget/score-trend').then(mod => ({ default: mod.ScoreTrend })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted" /> }
);

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function BudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()));
  const [debtStrategy, setDebtStrategy] = useState<DebtStrategy>('snowball');

  const {
    budgets,
    savingsGoals,
    getBudgetByMonth,
    createBudget,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
  } = useBudget();

  const { creditScore } = useCreditScore();

  // Get or create budget for selected month
  const budget = useMemo(() => {
    const existing = getBudgetByMonth(selectedMonth);
    if (existing) return existing;
    return createBudget(selectedMonth);
  }, [selectedMonth, getBudgetByMonth, createBudget]);

  const expensesByCategory = useMemo(
    () => getExpensesByCategory(selectedMonth),
    [selectedMonth, getExpensesByCategory]
  );

  function navigateMonth(direction: -1 | 1) {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    setSelectedMonth(getMonthKey(date));
  }

  const monthSelector = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigateMonth(-1)}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <span className="min-w-[160px] text-center text-sm font-medium text-foreground">
        {getMonthLabel(selectedMonth)}
      </span>
      <button
        onClick={() => navigateMonth(1)}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Next month"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={fadeIn}>
      <PageHeader
        title="Budget & Financial Health"
        description="Track income, expenses, and debt repayment progress."
        actions={monthSelector}
      />

      {/* Monthly Overview */}
      <BudgetOverview
        totalIncome={budget.totalIncome}
        totalExpenses={budget.totalExpenses}
      />

      {/* Income & Expenses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <IncomeSection
          income={budget.income}
          month={selectedMonth}
          onAdd={addIncome}
          onUpdate={updateIncome}
          onDelete={deleteIncome}
        />
        <ExpenseSection
          expenses={budget.expenses}
          month={selectedMonth}
          onAdd={addExpense}
          onUpdate={updateExpense}
          onDelete={deleteExpense}
        />
      </div>

      {/* Budget Bar */}
      <BudgetBar
        totalIncome={budget.totalIncome}
        totalExpenses={budget.totalExpenses}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SpendingChart
          expensesByCategory={expensesByCategory}
          totalExpenses={budget.totalExpenses}
        />
        <TrendChart budgets={budgets} />
      </div>

      {/* Debt Repayment Tracker */}
      <DebtTracker
        strategy={debtStrategy}
        onStrategyChange={setDebtStrategy}
        availableForDebt={budget.availableForDebt}
      />

      {/* Credit Score & Savings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CreditScoreCard
          score={creditScore.score}
          rating={creditScore.rating}
        />
        <CreditFactors factors={creditScore.factors} />
        <ScoreTrend history={creditScore.history} />
      </div>

      {/* Savings Goals */}
      <SavingsGoals
        goals={savingsGoals}
        onAdd={addSavingsGoal}
        onUpdate={updateSavingsGoal}
        onDelete={deleteSavingsGoal}
      />
    </motion.div>
  );
}
