'use client';

import { cn } from '@/lib/utils';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2" role="group" aria-label="Suggested replies">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className={cn(
            'rounded-full border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 px-3 py-1 text-xs font-medium',
            'text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/15 transition-colors'
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
