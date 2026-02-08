'use client';

import { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import type { TempleLetter } from '@vindicate/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TemplateLetterDisplayProps {
  letter: TempleLetter;
}

function highlightPlaceholders(content: string): React.ReactNode[] {
  const parts = content.split(/({{[^}]+}})/g);
  return parts.map((part, i) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      const fieldName = part.slice(2, -2);
      const label = fieldName.replace(/_/g, ' ');
      return (
        <span
          key={i}
          className="inline-block rounded bg-[hsl(var(--accent))]/15 px-1.5 py-0.5 text-[hsl(var(--accent))] font-medium"
          title={`Replace with: ${label}`}
        >
          [{label}]
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function getPlaceholderDescription(placeholder: string): string {
  const descriptions: Record<string, string> = {
    your_name: 'Your full legal name',
    your_address: 'Your street address',
    your_city_state_zip: 'Your city, state, and ZIP code',
    date: "Today's date (Month Day, Year format)",
    collector_name: 'Name of the collection agency',
    collector_address: "Collection agency's street address",
    collector_city_state_zip: "Collection agency's city, state, and ZIP",
    account_number: 'Your account or reference number with the collector',
    date_of_contact: 'Date they first contacted you',
    your_state: 'Your state of residence (e.g., New York)',
    your_signature: 'Your handwritten signature',
    tracking_number: 'USPS certified mail tracking number',
    bureau_name: 'Credit bureau name (Equifax, Experian, or TransUnion)',
    bureau_address: "Credit bureau's mailing address",
    your_dob: 'Your date of birth',
    your_ssn_last_4: 'Last 4 digits of your Social Security Number',
    creditor_name: 'Name of the original creditor',
    dispute_reason: 'Reason for disputing (e.g., "balance is incorrect")',
    additional_details: 'Any additional details supporting your dispute',
    supporting_documents: 'List of documents you are enclosing',
    list_enclosures: 'Summary list of enclosed documents',
    original_creditor: 'Name of the original creditor',
    claimed_balance: 'The amount they claim you owe',
    reason_for_hardship: 'Brief description of your financial hardship',
    settlement_amount: 'Dollar amount you are offering',
    percentage: 'Percentage of the balance your offer represents',
    payment_method: 'How you will pay (e.g., certified check, money order)',
    creditor_address: "Creditor's street address",
    creditor_city_state_zip: "Creditor's city, state, and ZIP",
    start_date: 'When you became a customer',
    timeframe: 'Period when you had difficulty (e.g., "March-June 2025")',
    actions_taken: 'Steps you have taken to catch up',
    current_status: 'Current status of your account',
    dates_of_late_payments: 'Specific dates of late payments to remove',
  };
  return descriptions[placeholder] || `Replace with your ${placeholder.replace(/_/g, ' ')}`;
}

export function TemplateLetterDisplay({ letter }: TemplateLetterDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = letter.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Letter content with highlighted placeholders */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Letter Template</h3>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>
        <div className="p-5">
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
            {highlightPlaceholders(letter.content)}
          </pre>
        </div>
      </div>

      {/* Placeholder field descriptions */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">
            Fields to Fill In
          </h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {letter.placeholders.map((placeholder) => (
            <div key={placeholder} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 rounded bg-[hsl(var(--accent))]/15 px-1.5 py-0.5 font-medium text-[hsl(var(--accent))]">
                [{placeholder.replace(/_/g, ' ')}]
              </span>
              <span className="text-muted-foreground">
                {getPlaceholderDescription(placeholder)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
