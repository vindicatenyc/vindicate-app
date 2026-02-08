'use client';

import { cn } from '@/lib/utils';

export interface HarassmentChecklistState {
  calledBeforeEight: boolean;
  calledAfterNine: boolean;
  threatenedArrest: boolean;
  threatenedViolence: boolean;
  usedProfanity: boolean;
  refusedToIdentify: boolean;
  calledWorkplace: boolean;
  disclosedToThirdParty: boolean;
  repeatedCalls: boolean;
  falseRepresentation: boolean;
  otherViolation: string;
}

export const EMPTY_HARASSMENT_CHECKLIST: HarassmentChecklistState = {
  calledBeforeEight: false,
  calledAfterNine: false,
  threatenedArrest: false,
  threatenedViolence: false,
  usedProfanity: false,
  refusedToIdentify: false,
  calledWorkplace: false,
  disclosedToThirdParty: false,
  repeatedCalls: false,
  falseRepresentation: false,
  otherViolation: '',
};

const VIOLATIONS = [
  { key: 'calledBeforeEight' as const, label: 'Called before 8:00 AM' },
  { key: 'calledAfterNine' as const, label: 'Called after 9:00 PM' },
  { key: 'threatenedArrest' as const, label: 'Threatened arrest or jail' },
  { key: 'threatenedViolence' as const, label: 'Threatened violence or harm' },
  { key: 'usedProfanity' as const, label: 'Used profane or abusive language' },
  { key: 'refusedToIdentify' as const, label: 'Refused to identify themselves' },
  { key: 'calledWorkplace' as const, label: 'Called my workplace after being told not to' },
  { key: 'disclosedToThirdParty' as const, label: 'Disclosed debt to a third party' },
  { key: 'repeatedCalls' as const, label: 'Repeated/excessive calls (harassment)' },
  { key: 'falseRepresentation' as const, label: 'Misrepresented themselves (e.g., claimed to be attorney/gov)' },
];

interface HarassmentChecklistProps {
  value: HarassmentChecklistState;
  onChange: (value: HarassmentChecklistState) => void;
  className?: string;
}

export function HarassmentChecklist({ value, onChange, className }: HarassmentChecklistProps) {
  const toggleCheckbox = (key: keyof Omit<HarassmentChecklistState, 'otherViolation'>) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className={cn('rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30 p-4 space-y-3', className)}>
      <p className="text-sm font-medium text-red-800 dark:text-red-300">
        FDCPA Violation Checklist
      </p>
      <p className="text-xs text-red-600 dark:text-red-400">
        Check all violations that occurred. This documentation can support a complaint or lawsuit.
      </p>

      <div className="space-y-2">
        {VIOLATIONS.map(({ key, label }) => (
          <label key={key} className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={value[key]}
              onChange={() => toggleCheckbox(key)}
              className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-foreground">{label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm text-foreground mb-1">Other violation</label>
        <input
          type="text"
          value={value.otherViolation}
          onChange={e => onChange({ ...value, otherViolation: e.target.value })}
          placeholder="Describe any other FDCPA violation..."
          className="h-9 w-full rounded-md border border-red-200 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        />
      </div>
    </div>
  );
}
