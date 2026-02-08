'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Account, AccountStatus, AccountCategory } from '@vindicate/shared';
import { ACCOUNT_STATUS_CONFIG, ACCOUNT_CATEGORY_CONFIG } from '@vindicate/shared';
import { useAccounts } from '@/hooks/use-accounts';
import type { NewAccount } from '@/hooks/use-accounts';
import { Button } from '@/components/ui/button';

const INPUT_CLASS = 'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

const ALL_STATUSES: AccountStatus[] = [
  'current', 'late', 'in-collections', 'charged-off', 'disputed',
  'payment-plan', 'settled', 'paid-in-full', 'in-litigation', 'bankrupt', 'unknown',
];

const ALL_CATEGORIES: AccountCategory[] = [
  'credit-card', 'medical', 'student-loan', 'auto-loan',
  'personal-loan', 'utility', 'rent', 'tax', 'other',
];

interface AccountFormProps {
  existingAccount?: Account;
}

interface FormErrors {
  creditorName?: string;
  originalBalance?: string;
  currentBalance?: string;
  interestRate?: string;
  minimumPayment?: string;
}

export function AccountForm({ existingAccount }: AccountFormProps) {
  const router = useRouter();
  const { addAccount, updateAccount } = useAccounts();
  const isEditing = !!existingAccount;

  const [creditorName, setCreditorName] = useState(existingAccount?.creditorName ?? '');
  const [accountNumber, setAccountNumber] = useState(existingAccount?.accountNumber ?? '');
  const [originalBalance, setOriginalBalance] = useState(
    existingAccount ? String(existingAccount.originalBalance) : ''
  );
  const [currentBalance, setCurrentBalance] = useState(
    existingAccount ? String(existingAccount.currentBalance) : ''
  );
  const [status, setStatus] = useState<AccountStatus>(existingAccount?.status ?? 'unknown');
  const [category, setCategory] = useState<AccountCategory>(existingAccount?.category ?? 'other');
  const [collectorName, setCollectorName] = useState(existingAccount?.collectorName ?? '');
  const [creditorPhone, setCreditorPhone] = useState(existingAccount?.creditorPhone ?? '');
  const [creditorAddress, setCreditorAddress] = useState(existingAccount?.creditorAddress ?? '');
  const [interestRate, setInterestRate] = useState(
    existingAccount?.interestRate !== undefined ? String(existingAccount.interestRate) : ''
  );
  const [minimumPayment, setMinimumPayment] = useState(
    existingAccount?.minimumPayment !== undefined ? String(existingAccount.minimumPayment) : ''
  );
  const [notes, setNotes] = useState(existingAccount?.notes ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!creditorName.trim()) {
      newErrors.creditorName = 'Creditor name is required';
    }

    const origBal = parseFloat(originalBalance);
    if (!originalBalance.trim() || isNaN(origBal) || origBal < 0) {
      newErrors.originalBalance = 'Enter a valid amount';
    }

    const curBal = parseFloat(currentBalance);
    if (!currentBalance.trim() || isNaN(curBal) || curBal < 0) {
      newErrors.currentBalance = 'Enter a valid amount';
    }

    if (interestRate.trim()) {
      const rate = parseFloat(interestRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.interestRate = 'Enter a valid rate (0-100)';
      }
    }

    if (minimumPayment.trim()) {
      const mp = parseFloat(minimumPayment);
      if (isNaN(mp) || mp < 0) {
        newErrors.minimumPayment = 'Enter a valid amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [creditorName, originalBalance, currentBalance, interestRate, minimumPayment]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date().toISOString();

    if (isEditing && existingAccount) {
      updateAccount(existingAccount.id, {
        creditorName: creditorName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        originalBalance: parseFloat(originalBalance),
        currentBalance: parseFloat(currentBalance),
        status,
        category,
        collectorName: collectorName.trim() || undefined,
        creditorPhone: creditorPhone.trim() || undefined,
        creditorAddress: creditorAddress.trim() || undefined,
        interestRate: interestRate.trim() ? parseFloat(interestRate) : undefined,
        minimumPayment: minimumPayment.trim() ? parseFloat(minimumPayment) : undefined,
        notes: notes.trim() || undefined,
      });
      window.alert('Account updated successfully!');
    } else {
      const newAccount: NewAccount = {
        creditorName: creditorName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        originalBalance: parseFloat(originalBalance),
        currentBalance: parseFloat(currentBalance),
        status,
        category,
        collectorName: collectorName.trim() || undefined,
        creditorPhone: creditorPhone.trim() || undefined,
        creditorAddress: creditorAddress.trim() || undefined,
        interestRate: interestRate.trim() ? parseFloat(interestRate) : undefined,
        minimumPayment: minimumPayment.trim() ? parseFloat(minimumPayment) : undefined,
        notes: notes.trim() || undefined,
        dateOpened: now,
        dateOfLastActivity: now,
        dateAddedToApp: now,
        importSource: 'manual',
      };
      addAccount(newAccount);
      window.alert('Account added successfully!');
    }

    router.push('/accounts');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Creditor Info */}
      <fieldset className="rounded-xl border border-border bg-card p-5 space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Creditor Information
        </legend>

        <FormField
          label="Creditor Name"
          required
          error={errors.creditorName}
        >
          <input
            type="text"
            value={creditorName}
            onChange={e => setCreditorName(e.target.value)}
            className={INPUT_CLASS}
            placeholder="e.g. Capital One"
            aria-required="true"
          />
        </FormField>

        <FormField label="Account Number">
          <input
            type="text"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value)}
            className={INPUT_CLASS}
            placeholder="e.g. ****4521"
          />
        </FormField>

        <FormField label="Collector Name">
          <input
            type="text"
            value={collectorName}
            onChange={e => setCollectorName(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Collection agency (if applicable)"
          />
        </FormField>

        <FormField label="Creditor Phone">
          <input
            type="tel"
            value={creditorPhone}
            onChange={e => setCreditorPhone(e.target.value)}
            className={INPUT_CLASS}
            placeholder="800-555-0100"
          />
        </FormField>

        <FormField label="Creditor Address">
          <input
            type="text"
            value={creditorAddress}
            onChange={e => setCreditorAddress(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Full mailing address"
          />
        </FormField>
      </fieldset>

      {/* Financial Details */}
      <fieldset className="rounded-xl border border-border bg-card p-5 space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Financial Details
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Original Balance"
            required
            error={errors.originalBalance}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={originalBalance}
                onChange={e => setOriginalBalance(e.target.value)}
                className={`${INPUT_CLASS} pl-7`}
                placeholder="0.00"
                aria-required="true"
              />
            </div>
          </FormField>

          <FormField
            label="Current Balance"
            required
            error={errors.currentBalance}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentBalance}
                onChange={e => setCurrentBalance(e.target.value)}
                className={`${INPUT_CLASS} pl-7`}
                placeholder="0.00"
                aria-required="true"
              />
            </div>
          </FormField>

          <FormField label="Interest Rate" error={errors.interestRate}>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                className={`${INPUT_CLASS} pr-7`}
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </FormField>

          <FormField label="Minimum Payment" error={errors.minimumPayment}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minimumPayment}
                onChange={e => setMinimumPayment(e.target.value)}
                className={`${INPUT_CLASS} pl-7`}
                placeholder="0.00"
              />
            </div>
          </FormField>
        </div>
      </fieldset>

      {/* Status & Category */}
      <fieldset className="rounded-xl border border-border bg-card p-5 space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Classification
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Status">
            <select
              value={status}
              onChange={e => setStatus(e.target.value as AccountStatus)}
              className={INPUT_CLASS}
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{ACCOUNT_STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Category">
            <select
              value={category}
              onChange={e => setCategory(e.target.value as AccountCategory)}
              className={INPUT_CLASS}
            >
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{ACCOUNT_CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>
          </FormField>
        </div>
      </fieldset>

      {/* Notes */}
      <fieldset className="rounded-xl border border-border bg-card p-5 space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Notes
        </legend>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          className={`${INPUT_CLASS} resize-y`}
          placeholder="Any notes about this account..."
          aria-label="Account notes"
        />
      </fieldset>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update Account' : 'Add Account'}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  );
}
