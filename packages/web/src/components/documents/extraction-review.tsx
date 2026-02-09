'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle2,
  RotateCw,
  SkipForward,
  AlertCircle,
  Loader2,
  Sparkles,
  FileText,
  CreditCard,
  DollarSign,
  Building2,
  HeartPulse,
} from 'lucide-react';
import type { Document, DocumentType } from '@vindicate/shared';
import { DOCUMENT_TYPE_CONFIG } from '@vindicate/shared';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExtractionResults } from './extraction-results';
import type { BankStatementExtraction } from '@/lib/ai/schemas/bank-statement';
import type { CreditReportExtraction } from '@/lib/ai/schemas/credit-report';
import type { PayStubExtraction } from '@/lib/ai/schemas/pay-stub';
import type { MedicalBillExtraction } from '@/lib/ai/schemas/medical-bill';
import type { TaxDocumentExtraction } from '@/lib/ai/schemas/tax-document';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getMonthlyIncome(grossPay: number, frequency?: string): number {
  switch (frequency) {
    case 'weekly': return grossPay * 52 / 12;
    case 'biweekly': return grossPay * 26 / 12;
    case 'semimonthly': return grossPay * 2;
    case 'monthly': return grossPay;
    default: return grossPay; // assume monthly
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NormalizationState = 'idle' | 'normalizing' | 'success' | 'error';

interface ExtractionReviewProps {
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNormalize: (documentId: string, selections?: Record<string, unknown>) => Promise<void>;
  onReprocess: (documentId: string) => Promise<void>;
  onSkip: (documentId: string) => void;
}

// ---------------------------------------------------------------------------
// Action summary builders
// ---------------------------------------------------------------------------

function getCreditReportSummary(data: CreditReportExtraction) {
  const accounts = data.accounts ?? [];
  const collections = data.collections ?? [];
  const total = accounts.length + collections.length;
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0) + collections.reduce((s, c) => s + c.balance, 0);
  return {
    icon: CreditCard,
    label: `Add ${total} account${total !== 1 ? 's' : ''} to your dashboard`,
    detail: `Total balance: ${formatCurrency(totalBalance)}`,
    count: total,
  };
}

function getBankStatementSummary(data: BankStatementExtraction) {
  const txns = data.transactions ?? [];
  const debits = txns.filter(t => t.type === 'debit');
  const credits = txns.filter(t => t.type === 'credit');
  return {
    icon: DollarSign,
    label: `Import ${txns.length} transaction${txns.length !== 1 ? 's' : ''} to your budget`,
    detail: `${credits.length} income, ${debits.length} expenses`,
    count: txns.length,
  };
}

function getPayStubSummary(data: PayStubExtraction) {
  const monthly = getMonthlyIncome(data.net_pay, data.pay_frequency);
  return {
    icon: Building2,
    label: `Add income: ${formatCurrency(monthly)}/month from ${data.employer_name}`,
    detail: `Gross: ${formatCurrency(data.gross_pay)}, Net: ${formatCurrency(data.net_pay)}`,
    count: 1,
  };
}

function getMedicalBillSummary(data: MedicalBillExtraction) {
  const amount = data.patient_responsibility ?? data.total_amount;
  return {
    icon: HeartPulse,
    label: `Add medical debt: ${formatCurrency(amount)} from ${data.provider_name}`,
    detail: data.insurance_paid ? `Insurance covered: ${formatCurrency(data.insurance_paid)}` : undefined,
    count: 1,
  };
}

function getTaxDocumentSummary(data: TaxDocumentExtraction) {
  const income = data.wages ?? data.amount ?? data.agi;
  return {
    icon: FileText,
    label: `Update income records: ${data.document_subtype} (${data.tax_year})`,
    detail: income != null ? `Income: ${formatCurrency(income)}` : undefined,
    count: 1,
  };
}

function getActionSummary(docType: DocumentType, data: Record<string, unknown>) {
  switch (docType) {
    case 'credit-report': return getCreditReportSummary(data as unknown as CreditReportExtraction);
    case 'bank-statement': return getBankStatementSummary(data as unknown as BankStatementExtraction);
    case 'income-verification': return getPayStubSummary(data as unknown as PayStubExtraction);
    case 'medical-bill': return getMedicalBillSummary(data as unknown as MedicalBillExtraction);
    case 'tax-document': return getTaxDocumentSummary(data as unknown as TaxDocumentExtraction);
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Main ExtractionReview component
// ---------------------------------------------------------------------------

export function ExtractionReview({
  document: doc,
  open,
  onOpenChange,
  onNormalize,
  onReprocess,
  onSkip,
}: ExtractionReviewProps) {
  const [normState, setNormState] = useState<NormalizationState>('idle');
  const [reprocessing, setReprocessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const extractedData = doc.extractedData;
  const hasData = extractedData && Object.keys(extractedData).length > 0 && !('error' in extractedData);

  // Resolve effective document type (prefer AI-classified for extraction type)
  const effectiveType = (
    ['bank-statement', 'credit-report', 'income-verification', 'medical-bill', 'tax-document'].includes(doc.autoClassifiedType ?? '')
      ? doc.autoClassifiedType as DocumentType
      : doc.type
  );

  const actionSummary = hasData ? getActionSummary(effectiveType, extractedData) : null;

  const handleConfirm = useCallback(async () => {
    setNormState('normalizing');
    setErrorMsg(null);
    try {
      await onNormalize(doc.id);
      setNormState('success');
      setSuccessMsg(getSuccessMessage(effectiveType, extractedData));
    } catch (err) {
      setNormState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Normalization failed');
    }
  }, [doc.id, effectiveType, extractedData, onNormalize]);

  const handleReprocess = useCallback(async () => {
    setReprocessing(true);
    setErrorMsg(null);
    try {
      await onReprocess(doc.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Reprocessing failed');
    } finally {
      setReprocessing(false);
    }
  }, [doc.id, onReprocess]);

  const handleSkip = useCallback(() => {
    onSkip(doc.id);
    onOpenChange(false);
  }, [doc.id, onSkip, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg lg:max-w-xl overflow-hidden flex flex-col"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Document Review
          </SheetTitle>
          <SheetDescription>
            {doc.name} — {DOCUMENT_TYPE_CONFIG[doc.type]?.label ?? doc.type}
            {doc.autoClassifiedType && doc.autoClassifiedType !== doc.type && (
              <span className="ml-1 text-blue-600 dark:text-blue-400">
                (AI detected: {DOCUMENT_TYPE_CONFIG[doc.autoClassifiedType as DocumentType]?.label ?? doc.autoClassifiedType})
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-4">
          {/* Confidence indicator */}
          {doc.extractionConfidence != null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    doc.extractionConfidence >= 0.7 ? 'bg-green-500' :
                    doc.extractionConfidence >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.round(doc.extractionConfidence * 100)}%` }}
                />
              </div>
              <span>{Math.round(doc.extractionConfidence * 100)}% confidence</span>
            </div>
          )}

          {/* Error state: no data or extraction error */}
          {!hasData ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive/70" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {extractedData && 'error' in extractedData
                    ? "We couldn't read this document clearly."
                    : 'No data was extracted from this document.'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try uploading a higher quality scan, or reprocess with a more powerful model.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprocess}
                disabled={reprocessing}
              >
                {reprocessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <RotateCw className="h-4 w-4 mr-1.5" />
                )}
                Re-process with GPT-4.1
              </Button>
            </div>
          ) : (
            <>
              {/* Action summary card */}
              {actionSummary && normState === 'idle' && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <actionSummary.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{actionSummary.label}</p>
                      {actionSummary.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{actionSummary.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success state */}
              {normState === 'success' && successMsg && (
                <div className="rounded-lg border border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/10 p-4 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">{successMsg}</p>
                </div>
              )}

              {/* Error state */}
              {normState === 'error' && errorMsg && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </p>
                </div>
              )}

              {/* Extracted data display */}
              <ExtractionResults
                documentType={effectiveType}
                extractedData={extractedData}
              />
            </>
          )}
        </div>

        {/* Fixed footer actions */}
        <div className="shrink-0 border-t border-border pt-4 -mx-6 px-6 space-y-2">
          {hasData && normState === 'idle' && (
            <div className="flex gap-2">
              <Button
                onClick={handleConfirm}
                className="flex-1"
                disabled={normState !== 'idle'}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Confirm & Import
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReprocess}
                disabled={reprocessing}
                title="Re-process document"
              >
                {reprocessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {normState === 'normalizing' && (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              Importing data...
            </Button>
          )}

          {normState === 'error' && (
            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="flex-1">
                <RotateCw className="h-4 w-4 mr-1.5" />
                Retry Import
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                <SkipForward className="h-4 w-4 mr-1.5" />
                Skip
              </Button>
            </div>
          )}

          {normState === 'success' && (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          )}

          {(normState === 'idle' || !hasData) && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              <SkipForward className="h-4 w-4 mr-1.5" />
              Skip — review later
            </Button>
          )}

          {/* Model info */}
          {doc.extractionModel && (
            <p className="text-center text-[10px] text-muted-foreground">
              Processed with {doc.extractionModel}
              {doc.extractionCost != null && ` · $${doc.extractionCost.toFixed(4)}`}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Success message builder
// ---------------------------------------------------------------------------

function getSuccessMessage(docType: DocumentType, data: Record<string, unknown> | undefined): string {
  if (!data) return 'Data imported successfully!';

  switch (docType) {
    case 'credit-report': {
      const d = data as unknown as CreditReportExtraction;
      const count = (d.accounts?.length ?? 0) + (d.collections?.length ?? 0);
      return `${count} account${count !== 1 ? 's' : ''} added to your dashboard!`;
    }
    case 'bank-statement': {
      const d = data as unknown as BankStatementExtraction;
      return `${d.transactions?.length ?? 0} transactions imported to your budget!`;
    }
    case 'income-verification': {
      const d = data as unknown as PayStubExtraction;
      return `Income entry added: ${formatCurrency(d.net_pay)}/pay period from ${d.employer_name}`;
    }
    case 'medical-bill': {
      const d = data as unknown as MedicalBillExtraction;
      return `Medical debt added: ${formatCurrency(d.patient_responsibility ?? d.total_amount)} from ${d.provider_name}`;
    }
    case 'tax-document': {
      const d = data as unknown as TaxDocumentExtraction;
      return `Tax records updated: ${d.document_subtype} (${d.tax_year})`;
    }
    default:
      return 'Data imported successfully!';
  }
}
