'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SavingsGoal } from '@vindicate/shared';

interface SavingsGoalFormProps {
  existingGoal?: SavingsGoal;
  onSubmit: (data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
  }) => void;
  onCancel: () => void;
  className?: string;
}

export function SavingsGoalForm({
  existingGoal,
  onSubmit,
  onCancel,
  className,
}: SavingsGoalFormProps) {
  const [name, setName] = useState(existingGoal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(
    existingGoal ? String(existingGoal.targetAmount) : ''
  );
  const [currentAmount, setCurrentAmount] = useState(
    existingGoal ? String(existingGoal.currentAmount) : '0'
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    existingGoal ? String(existingGoal.monthlyContribution) : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) newErrors.targetAmount = 'Enter a valid target amount';
    const current = parseFloat(currentAmount);
    if (isNaN(current) || current < 0) newErrors.currentAmount = 'Enter a valid amount';
    const monthly = parseFloat(monthlyContribution);
    if (isNaN(monthly) || monthly < 0) newErrors.monthlyContribution = 'Enter a valid amount';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      monthlyContribution: parseFloat(monthlyContribution),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'space-y-3 rounded-xl border border-border bg-card p-4 shadow-soft',
        className
      )}
    >
      <h4 className="text-sm font-medium text-foreground">
        {existingGoal ? 'Edit Goal' : 'New Savings Goal'}
      </h4>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Goal Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          placeholder="e.g., Emergency Fund"
        />
        {errors.name && (
          <p className="mt-0.5 text-xs text-red-600">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Target Amount ($)
          </label>
          <input
            type="number"
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            placeholder="5000"
            min="0"
            step="0.01"
          />
          {errors.targetAmount && (
            <p className="mt-0.5 text-xs text-red-600">{errors.targetAmount}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Current Amount ($)
          </label>
          <input
            type="number"
            value={currentAmount}
            onChange={e => setCurrentAmount(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            placeholder="0"
            min="0"
            step="0.01"
          />
          {errors.currentAmount && (
            <p className="mt-0.5 text-xs text-red-600">{errors.currentAmount}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Monthly Contribution ($)
        </label>
        <input
          type="number"
          value={monthlyContribution}
          onChange={e => setMonthlyContribution(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          placeholder="100"
          min="0"
          step="0.01"
        />
        {errors.monthlyContribution && (
          <p className="mt-0.5 text-xs text-red-600">{errors.monthlyContribution}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          {existingGoal ? 'Save Changes' : 'Add Goal'}
        </button>
      </div>
    </form>
  );
}
