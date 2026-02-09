'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
} from 'lucide-react';
import type { DocumentType } from '@vindicate/shared';
import { cn } from '@/lib/utils';
import type { BankStatementExtraction } from '@/lib/ai/schemas/bank-statement';
import type { CreditReportExtraction } from '@/lib/ai/schemas/credit-report';
import type { PayStubExtraction } from '@/lib/ai/schemas/pay-stub';
import type { MedicalBillExtraction } from '@/lib/ai/schemas/medical-bill';
import type { TaxDocumentExtraction } from '@/lib/ai/schemas/tax-document';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ExtractionResultsProps {
  documentType: DocumentType;
  extractedData: Record<string, unknown>;
  className?: string;
}

export function ExtractionResults({ documentType, extractedData, className }: ExtractionResultsProps) {
  const [showRaw, setShowRaw] = useState(false);

  const renderContent = () => {
    switch (documentType) {
      case 'bank-statement':
        return <BankStatementResults data={extractedData as unknown as BankStatementExtraction} />;
      case 'credit-report':
        return <CreditReportResults data={extractedData as unknown as CreditReportExtraction} />;
      case 'income-verification':
        return <PayStubResults data={extractedData as unknown as PayStubExtraction} />;
      case 'medical-bill':
        return <MedicalBillResults data={extractedData as unknown as MedicalBillExtraction} />;
      case 'tax-document':
        return <TaxDocumentResults data={extractedData as unknown as TaxDocumentExtraction} />;
      default:
        return <GenericResults data={extractedData} />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {renderContent()}

      {/* Raw data toggle */}
      <div className="border-t border-border pt-3">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showRaw ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Raw Data
        </button>
        {showRaw && (
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground font-mono">
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoGrid({ items }: { items: { label: string; value: string | React.ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {items.filter(i => i.value && i.value !== '—').map((item, i) => (
        <div key={i}>
          <p className="text-[11px] text-muted-foreground">{item.label}</p>
          <p className="text-sm font-medium text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bank Statement
// ---------------------------------------------------------------------------

function BankStatementResults({ data }: { data: BankStatementExtraction }) {
  const transactions = data.transactions ?? [];
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const netChange = totalCredits - totalDebits;

  return (
    <div className="space-y-4">
      <Section title="Account Details" icon={Building2}>
        <InfoGrid items={[
          { label: 'Bank', value: data.bank_name },
          { label: 'Account Type', value: data.account_type ? data.account_type.charAt(0).toUpperCase() + data.account_type.slice(1) : '—' },
          { label: 'Last Four', value: data.account_last_four ? `••••${data.account_last_four}` : '—' },
          { label: 'Period', value: data.statement_period ? `${formatDate(data.statement_period.start)} — ${formatDate(data.statement_period.end)}` : '—' },
          { label: 'Opening Balance', value: formatCurrency(data.opening_balance) },
          { label: 'Closing Balance', value: formatCurrency(data.closing_balance) },
        ]} />
      </Section>

      {transactions.length > 0 && (
        <Section title={`Transactions (${transactions.length})`} icon={CreditCard}>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={i} className={cn('border-t border-border', i % 2 === 0 ? '' : 'bg-muted/20')}>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-3 py-1.5 text-xs text-foreground">
                        <span className="line-clamp-1">{tx.description}</span>
                        {tx.category && (
                          <span className="ml-1 text-[10px] text-muted-foreground">({tx.category})</span>
                        )}
                      </td>
                      <td className={cn(
                        'px-3 py-1.5 text-xs font-medium text-right whitespace-nowrap',
                        tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      <Section title="Summary" icon={DollarSign}>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-3">
            <p className="text-[11px] text-muted-foreground">Total Debits</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(totalDebits)}</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-3">
            <p className="text-[11px] text-muted-foreground">Total Credits</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(totalCredits)}</p>
          </div>
          <div className={cn('rounded-lg p-3', netChange >= 0 ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10')}>
            <p className="text-[11px] text-muted-foreground">Net Change</p>
            <p className={cn('text-sm font-semibold', netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Credit Report
// ---------------------------------------------------------------------------

function CreditReportResults({ data }: { data: CreditReportExtraction }) {
  const accounts = data.accounts ?? [];
  const collections = data.collections ?? [];
  const inquiries = data.inquiries ?? [];
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const collectionsBalance = collections.reduce((s, c) => s + c.balance, 0);

  return (
    <div className="space-y-4">
      <Section title="Report Overview" icon={FileText}>
        <InfoGrid items={[
          { label: 'Bureau', value: data.bureau ? data.bureau.charAt(0).toUpperCase() + data.bureau.slice(1) : '—' },
          { label: 'Report Date', value: formatDate(data.report_date) },
          { label: 'Credit Score', value: data.credit_score != null ? (
            <span className="text-lg font-bold">{data.credit_score}</span>
          ) : '—' },
          { label: 'Total Accounts', value: String(accounts.length) },
        ]} />
      </Section>

      {accounts.length > 0 && (
        <Section title={`Accounts (${accounts.length})`} icon={CreditCard}>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">Creditor</th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">Balance</th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">Status</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">Past Due</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acct, i) => (
                    <tr key={i} className={cn('border-t border-border', i % 2 === 0 ? '' : 'bg-muted/20')}>
                      <td className="px-3 py-1.5 text-xs font-medium text-foreground">
                        {acct.creditor_name}
                        {acct.account_number_last_four && (
                          <span className="text-muted-foreground ml-1">••{acct.account_number_last_four}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{acct.account_type}</td>
                      <td className="px-3 py-1.5 text-xs font-medium text-right">{formatCurrency(acct.balance)}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn(
                          'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                          acct.status?.toLowerCase().includes('open') || acct.payment_status?.toLowerCase().includes('current')
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                          {acct.payment_status ?? acct.status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-xs text-right">
                        {acct.past_due_amount ? (
                          <span className="text-red-600 dark:text-red-400">{formatCurrency(acct.past_due_amount)}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {collections.length > 0 && (
        <Section title={`Collections (${collections.length})`} icon={AlertCircle}>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 overflow-hidden">
            <div className="max-h-48 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-destructive/10 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">Collector</th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">Original</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((col, i) => (
                    <tr key={i} className="border-t border-destructive/20">
                      <td className="px-3 py-1.5 text-xs font-medium text-foreground">{col.creditor_name}</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{col.original_creditor ?? '—'}</td>
                      <td className="px-3 py-1.5 text-xs font-medium text-right text-red-600 dark:text-red-400">{formatCurrency(col.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {inquiries.length > 0 && (
        <Section title={`Inquiries (${inquiries.length})`}>
          <div className="space-y-1">
            {inquiries.map((inq, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1">
                <span className="text-foreground">{inq.creditor_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{formatDate(inq.date)}</span>
                  {inq.type && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      inq.type === 'hard'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {inq.type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Summary" icon={DollarSign}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">Accounts</p>
            <p className="text-sm font-semibold">{accounts.length}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">Total Balance</p>
            <p className="text-sm font-semibold">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">Collections</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{collections.length}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">Collections Bal.</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(collectionsBalance)}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pay Stub
// ---------------------------------------------------------------------------

function PayStubResults({ data }: { data: PayStubExtraction }) {
  const deductions = data.deductions ?? [];
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-4">
      <Section title="Employment" icon={Building2}>
        <InfoGrid items={[
          { label: 'Employer', value: data.employer_name },
          { label: 'Pay Date', value: formatDate(data.pay_date) },
          { label: 'Pay Period', value: data.pay_period ? `${formatDate(data.pay_period.start)} — ${formatDate(data.pay_period.end)}` : '—' },
          { label: 'Frequency', value: data.pay_frequency ? data.pay_frequency.charAt(0).toUpperCase() + data.pay_frequency.slice(1) : '—' },
        ]} />
      </Section>

      <Section title="Pay Breakdown" icon={DollarSign}>
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Gross Pay</span>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(data.gross_pay)}</span>
          </div>
          {deductions.length > 0 && (
            <>
              <div className="border-t border-border pt-2 space-y-1">
                {deductions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="text-red-600 dark:text-red-400">-{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                <span className="text-muted-foreground">Total Deductions</span>
                <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(totalDeductions)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-sm font-medium text-foreground">Net Pay</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(data.net_pay)}</span>
          </div>
        </div>
      </Section>

      {(data.ytd_gross != null || data.ytd_net != null) && (
        <Section title="Year-to-Date" icon={Calendar}>
          <InfoGrid items={[
            { label: 'YTD Gross', value: formatCurrency(data.ytd_gross) },
            { label: 'YTD Net', value: formatCurrency(data.ytd_net) },
          ]} />
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Medical Bill
// ---------------------------------------------------------------------------

function MedicalBillResults({ data }: { data: MedicalBillExtraction }) {
  const charges = data.charges ?? [];

  return (
    <div className="space-y-4">
      <Section title="Provider Details" icon={Building2}>
        <InfoGrid items={[
          { label: 'Provider', value: data.provider_name },
          { label: 'Patient', value: data.patient_name ?? '—' },
          { label: 'Service Date', value: formatDate(data.service_date) },
          { label: 'Billing Date', value: formatDate(data.billing_date) },
          { label: 'Account #', value: data.account_number ?? '—' },
        ]} />
      </Section>

      {charges.length > 0 && (
        <Section title={`Charges (${charges.length})`} icon={DollarSign}>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">Description</th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((ch, i) => (
                  <tr key={i} className={cn('border-t border-border', i % 2 === 0 ? '' : 'bg-muted/20')}>
                    <td className="px-3 py-1.5 text-xs text-foreground">{ch.description}</td>
                    <td className="px-3 py-1.5 text-xs font-medium text-right">{formatCurrency(ch.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="Summary" icon={DollarSign}>
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Total Charges</span>
            <span className="text-sm font-semibold">{formatCurrency(data.total_amount)}</span>
          </div>
          {data.insurance_paid != null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Insurance Paid</span>
              <span className="text-green-600 dark:text-green-400">-{formatCurrency(data.insurance_paid)}</span>
            </div>
          )}
          {data.patient_responsibility != null && (
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-medium text-foreground">Your Responsibility</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(data.patient_responsibility)}</span>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tax Document
// ---------------------------------------------------------------------------

function TaxDocumentResults({ data }: { data: TaxDocumentExtraction }) {
  return (
    <div className="space-y-4">
      <Section title="Document Info" icon={FileText}>
        <InfoGrid items={[
          { label: 'Type', value: data.document_subtype },
          { label: 'Tax Year', value: String(data.tax_year) },
          { label: 'Employer / Payer', value: data.employer_name ?? data.payer_name ?? '—' },
        ]} />
      </Section>

      {data.document_subtype === 'W-2' && (
        <Section title="W-2 Details" icon={DollarSign}>
          <InfoGrid items={[
            { label: 'Wages', value: formatCurrency(data.wages) },
            { label: 'Federal Tax Withheld', value: formatCurrency(data.federal_tax_withheld) },
            { label: 'State Tax Withheld', value: formatCurrency(data.state_tax_withheld) },
            { label: 'Social Security Wages', value: formatCurrency(data.social_security_wages) },
            { label: 'Medicare Wages', value: formatCurrency(data.medicare_wages) },
          ]} />
        </Section>
      )}

      {(data.document_subtype?.startsWith('1099')) && (
        <Section title="1099 Details" icon={DollarSign}>
          <InfoGrid items={[
            { label: 'Amount', value: formatCurrency(data.amount) },
            { label: 'Type of Income', value: data.type_of_income ?? '—' },
          ]} />
        </Section>
      )}

      {data.document_subtype === '1040' && (
        <Section title="1040 Details" icon={DollarSign}>
          <InfoGrid items={[
            { label: 'AGI', value: formatCurrency(data.agi) },
            { label: 'Taxable Income', value: formatCurrency(data.taxable_income) },
            { label: 'Total Tax', value: formatCurrency(data.total_tax) },
            { label: 'Refund / Owed', value: data.refund_or_owed != null ? (
              <span className={data.refund_or_owed >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {formatCurrency(data.refund_or_owed)}
              </span>
            ) : '—' },
          ]} />
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic fallback
// ---------------------------------------------------------------------------

function GenericResults({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  );

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No structured data was extracted from this document.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2">
          <span className="text-xs text-muted-foreground min-w-[120px] shrink-0">
            {key.replace(/_/g, ' ')}
          </span>
          <span className="text-sm text-foreground">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
