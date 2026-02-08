'use client';

import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VinnyInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function VinnyInput({ onSend, disabled = false }: VinnyInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 border-t border-border px-3 py-2">
      <input
        ref={inputRef}
        type="text"
        placeholder={disabled ? 'Vinny is thinking...' : 'Ask Vinny anything...'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={disabled}
        className={cn(
          'flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none disabled:opacity-50'
        )}
        aria-label="Message to Vinny"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          value.trim() && !disabled
            ? 'bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90'
            : 'text-muted-foreground'
        )}
        aria-label="Send message"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
