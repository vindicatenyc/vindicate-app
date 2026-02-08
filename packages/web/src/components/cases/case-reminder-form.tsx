'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

interface CaseReminderFormProps {
  onAdd: (reminder: { title: string; date: string; notes?: string; isCompleted: boolean }) => void;
  className?: string;
}

export function CaseReminderForm({ onAdd, className }: CaseReminderFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    onAdd({
      title: title.trim(),
      date,
      notes: notes.trim() || undefined,
      isCompleted: false,
    });

    setTitle('');
    setDate('');
    setNotes('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add Reminder
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
      <div>
        <label htmlFor="rem-title" className="block text-sm font-medium text-foreground mb-1">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          id="rem-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Follow up on dispute response"
          className={INPUT_CLASS}
          required
        />
      </div>

      <div>
        <label htmlFor="rem-date" className="block text-sm font-medium text-foreground mb-1">
          Date <span className="text-destructive">*</span>
        </label>
        <input
          id="rem-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className={INPUT_CLASS}
          required
        />
      </div>

      <div>
        <label htmlFor="rem-notes" className="block text-sm font-medium text-foreground mb-1">
          Notes
        </label>
        <textarea
          id="rem-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes..."
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 resize-y"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">Add</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
