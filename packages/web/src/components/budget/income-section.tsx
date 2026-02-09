'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';
import type { IncomeEntry } from '@vindicate/shared';
import type { NewIncomeEntry } from '@/hooks/use-budget';

interface IncomeSectionProps {
  income: IncomeEntry[];
  month: string;
  onAdd: (month: string, entry: NewIncomeEntry) => IncomeEntry | null | Promise<IncomeEntry | null>;
  onUpdate: (month: string, id: string, updates: Partial<IncomeEntry>) => void | Promise<void>;
  onDelete: (month: string, id: string) => void | Promise<void>;
  className?: string;
}

const FREQUENCY_LABELS: Record<IncomeEntry['frequency'], string> = {
  monthly: 'Monthly',
  biweekly: 'Bi-weekly',
  weekly: 'Weekly',
  'one-time': 'One-time',
};

export function IncomeSection({
  income,
  month,
  onAdd,
  onUpdate,
  onDelete,
  className,
}: IncomeSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSource, setFormSource] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formFrequency, setFormFrequency] = useState<IncomeEntry['frequency']>('monthly');
  const [formRecurring, setFormRecurring] = useState(true);

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);

  function resetForm() {
    setFormSource('');
    setFormAmount('');
    setFormFrequency('monthly');
    setFormRecurring(true);
  }

  function handleAdd() {
    const amount = parseFloat(formAmount);
    if (!formSource.trim() || isNaN(amount) || amount <= 0) return;

    onAdd(month, {
      source: formSource.trim(),
      amount,
      frequency: formFrequency,
      isRecurring: formRecurring,
    });
    resetForm();
    setIsAdding(false);
  }

  function handleEdit(entry: IncomeEntry) {
    setEditingId(entry.id);
    setFormSource(entry.source);
    setFormAmount(String(entry.amount));
    setFormFrequency(entry.frequency);
    setFormRecurring(entry.isRecurring);
  }

  function handleSaveEdit(id: string) {
    const amount = parseFloat(formAmount);
    if (!formSource.trim() || isNaN(amount) || amount <= 0) return;

    onUpdate(month, id, {
      source: formSource.trim(),
      amount,
      frequency: formFrequency,
      isRecurring: formRecurring,
    });
    setEditingId(null);
    resetForm();
  }

  function handleCancelEdit() {
    setEditingId(null);
    resetForm();
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <DollarSign className="h-4 w-4 text-green-600" aria-hidden="true" />
          </div>
          <h3 className="font-medium text-foreground">Income</h3>
        </div>
        <p className="text-sm font-semibold text-green-600">
          {formatCurrency(totalIncome)}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {income.map(entry =>
          editingId === entry.id ? (
            <div key={entry.id} className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
              <input
                type="text"
                value={formSource}
                onChange={e => setFormSource(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                placeholder="Source name"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-28 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                />
                <select
                  value={formFrequency}
                  onChange={e => setFormFrequency(e.target.value as IncomeEntry['frequency'])}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formRecurring}
                    onChange={e => setFormRecurring(e.target.checked)}
                    className="rounded"
                  />
                  Recurring
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSaveEdit(entry.id)}
                    className="rounded-md p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                    aria-label="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={entry.id}
              className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{entry.source}</p>
                <p className="text-xs text-muted-foreground">
                  {FREQUENCY_LABELS[entry.frequency]}
                  {entry.isRecurring && ' \u00b7 Recurring'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(entry.amount)}
                </span>
                <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={`Edit ${entry.source}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(month, entry.id)}
                    className="rounded p-1 text-muted-foreground hover:text-red-600"
                    aria-label={`Delete ${entry.source}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {income.length === 0 && !isAdding && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No income entries yet
          </p>
        )}
      </div>

      {isAdding ? (
        <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/50 p-3">
          <input
            type="text"
            value={formSource}
            onChange={e => setFormSource(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            placeholder="Source name (e.g., Salary)"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              className="w-28 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              placeholder="Amount"
              min="0"
              step="0.01"
            />
            <select
              value={formFrequency}
              onChange={e => setFormFrequency(e.target.value as IncomeEntry['frequency'])}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="weekly">Weekly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formRecurring}
                onChange={e => setFormRecurring(e.target.checked)}
                className="rounded"
              />
              Recurring
            </label>
            <div className="flex gap-1">
              <button
                onClick={handleAdd}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90"
              >
                Add
              </button>
              <button
                onClick={() => { setIsAdding(false); resetForm(); }}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Add Income
        </button>
      )}
    </div>
  );
}
