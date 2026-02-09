'use client';

import { useState } from 'react';
import { Plus, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';
import type { SavingsGoal } from '@vindicate/shared';
import type { NewSavingsGoal } from '@/hooks/use-budget';
import { SavingsGoalCard } from './savings-goal-card';
import { SavingsGoalForm } from './savings-goal-form';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onAdd: (goal: NewSavingsGoal) => SavingsGoal | null | Promise<SavingsGoal | null>;
  onUpdate: (id: string, updates: Partial<SavingsGoal>) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  className?: string;
}

export function SavingsGoals({
  goals,
  onAdd,
  onUpdate,
  onDelete,
  className,
}: SavingsGoalsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  function handleAdd(data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
  }) {
    onAdd(data);
    setShowForm(false);
  }

  function handleEdit(goal: SavingsGoal) {
    setEditingGoal(goal);
    setShowForm(false);
  }

  function handleSaveEdit(data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
  }) {
    if (!editingGoal) return;
    onUpdate(editingGoal.id, data);
    setEditingGoal(null);
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-soft',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <PiggyBank className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <h3 className="font-medium text-foreground">Savings Goals</h3>
        </div>
        {totalTarget > 0 && (
          <p className="text-sm text-muted-foreground">
            {formatCurrency(totalSaved)} of {formatCurrency(totalTarget)}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {goals.map(goal =>
          editingGoal?.id === goal.id ? (
            <SavingsGoalForm
              key={goal.id}
              existingGoal={goal}
              onSubmit={handleSaveEdit}
              onCancel={() => setEditingGoal(null)}
            />
          ) : (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={onDelete}
            />
          )
        )}

        {goals.length === 0 && !showForm && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No savings goals yet. Start by adding one!
          </p>
        )}
      </div>

      {showForm ? (
        <div className="mt-3">
          <SavingsGoalForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : !editingGoal && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </button>
      )}
    </div>
  );
}
