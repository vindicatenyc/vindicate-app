'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Home,
  Zap,
  UtensilsCrossed,
  Car,
  Heart,
  Shield,
  CreditCard,
  User,
  GraduationCap,
  PiggyBank,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-date';
import { EXPENSE_CATEGORY_CONFIG } from '@vindicate/shared';
import type { ExpenseEntry, ExpenseCategory } from '@vindicate/shared';
import type { NewExpenseEntry } from '@/hooks/use-budget';

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  housing: Home,
  utilities: Zap,
  food: UtensilsCrossed,
  transportation: Car,
  healthcare: Heart,
  insurance: Shield,
  'debt-payments': CreditCard,
  personal: User,
  education: GraduationCap,
  savings: PiggyBank,
  other: MoreHorizontal,
};

interface ExpenseSectionProps {
  expenses: ExpenseEntry[];
  month: string;
  onAdd: (month: string, entry: NewExpenseEntry) => ExpenseEntry | null | Promise<ExpenseEntry | null>;
  onUpdate: (month: string, id: string, updates: Partial<ExpenseEntry>) => void | Promise<void>;
  onDelete: (month: string, id: string) => void | Promise<void>;
  className?: string;
}

export function ExpenseSection({
  expenses,
  month,
  onAdd,
  onUpdate,
  onDelete,
  className,
}: ExpenseSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('other');
  const [formFixed, setFormFixed] = useState(false);
  const [formRecurring, setFormRecurring] = useState(true);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by category
  const grouped = expenses.reduce<Record<string, ExpenseEntry[]>>((acc, exp) => {
    const cat = exp.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(exp);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort() as ExpenseCategory[];

  function resetForm() {
    setFormName('');
    setFormAmount('');
    setFormCategory('other');
    setFormFixed(false);
    setFormRecurring(true);
  }

  function handleAdd() {
    const amount = parseFloat(formAmount);
    if (!formName.trim() || isNaN(amount) || amount <= 0) return;

    onAdd(month, {
      name: formName.trim(),
      amount,
      category: formCategory,
      isFixed: formFixed,
      isRecurring: formRecurring,
    });
    resetForm();
    setIsAdding(false);
  }

  function handleEdit(entry: ExpenseEntry) {
    setEditingId(entry.id);
    setFormName(entry.name);
    setFormAmount(String(entry.amount));
    setFormCategory(entry.category);
    setFormFixed(entry.isFixed);
    setFormRecurring(entry.isRecurring);
  }

  function handleSaveEdit(id: string) {
    const amount = parseFloat(formAmount);
    if (!formName.trim() || isNaN(amount) || amount <= 0) return;

    onUpdate(month, id, {
      name: formName.trim(),
      amount,
      category: formCategory,
      isFixed: formFixed,
      isRecurring: formRecurring,
    });
    setEditingId(null);
    resetForm();
  }

  function handleCancelEdit() {
    setEditingId(null);
    resetForm();
  }

  function renderEditForm(entryId: string) {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            placeholder="Expense name"
          />
          <input
            type="number"
            value={formAmount}
            onChange={e => setFormAmount(e.target.value)}
            className="w-28 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            placeholder="Amount"
            min="0"
            step="0.01"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={formCategory}
            onChange={e => setFormCategory(e.target.value as ExpenseCategory)}
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {(Object.keys(EXPENSE_CATEGORY_CONFIG) as ExpenseCategory[]).map(cat => (
              <option key={cat} value={cat}>
                {EXPENSE_CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={formFixed}
              onChange={e => setFormFixed(e.target.checked)}
              className="rounded"
            />
            Fixed
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={formRecurring}
              onChange={e => setFormRecurring(e.target.checked)}
              className="rounded"
            />
            Recurring
          </label>
        </div>
        <div className="flex justify-end gap-1">
          {entryId === '__new__' ? (
            <>
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
            </>
          ) : (
            <>
              <button
                onClick={() => handleSaveEdit(entryId)}
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
            </>
          )}
        </div>
      </div>
    );
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
            <CreditCard className="h-4 w-4 text-red-600" aria-hidden="true" />
          </div>
          <h3 className="font-medium text-foreground">Expenses</h3>
        </div>
        <p className="text-sm font-semibold text-red-600">
          {formatCurrency(totalExpenses)}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {categories.map(cat => {
          const config = EXPENSE_CATEGORY_CONFIG[cat];
          const Icon = CATEGORY_ICONS[cat];
          const catTotal = grouped[cat].reduce((s, e) => s + e.amount, 0);

          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">
                    {config.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(catTotal)}
                </span>
              </div>

              <div className="ml-6 space-y-1">
                {grouped[cat].map(entry =>
                  editingId === entry.id ? (
                    <div key={entry.id}>{renderEditForm(entry.id)}</div>
                  ) : (
                    <div
                      key={entry.id}
                      className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/50"
                    >
                      <div>
                        <span className="text-sm text-foreground">{entry.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {entry.isFixed ? 'Fixed' : 'Variable'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">
                          {formatCurrency(entry.amount)}
                        </span>
                        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                            aria-label={`Edit ${entry.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(month, entry.id)}
                            className="rounded p-1 text-muted-foreground hover:text-red-600"
                            aria-label={`Delete ${entry.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}

        {expenses.length === 0 && !isAdding && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No expense entries yet
          </p>
        )}
      </div>

      {isAdding ? (
        <div className="mt-3">{renderEditForm('__new__')}</div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      )}
    </div>
  );
}
