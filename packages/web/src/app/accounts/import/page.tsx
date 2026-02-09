'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { WizardStepper } from '@/components/ui/wizard-stepper';
import { Button } from '@/components/ui/button';
import { StepReview, MOCK_FOUND_ACCOUNTS } from '@/components/accounts/import/step-review';
import { useAccounts } from '@/hooks/use-accounts';

const StepUpload = dynamic(
  () => import('@/components/accounts/import/step-upload').then(mod => ({ default: mod.StepUpload })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted" /> }
);

const StepConfirm = dynamic(
  () => import('@/components/accounts/import/step-confirm').then(mod => ({ default: mod.StepConfirm })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted" /> }
);

const WIZARD_STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'review', label: 'Review' },
  { id: 'confirm', label: 'Confirm' },
];

export default function CreditReportImportPage() {
  const router = useRouter();
  const { addAccount } = useAccounts();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(MOCK_FOUND_ACCOUNTS.map(a => a.id))
  );
  const [isImporting, setIsImporting] = useState(false);

  const handleUploadComplete = useCallback(() => {
    setCurrentStep(1);
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(MOCK_FOUND_ACCOUNTS.map(a => a.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function handleConfirm() {
    setIsImporting(true);
    const selected = MOCK_FOUND_ACCOUNTS.filter(a => selectedIds.has(a.id));
    const now = new Date().toISOString();

    for (const acct of selected) {
      addAccount({
        creditorName: acct.creditorName,
        originalBalance: acct.balance,
        currentBalance: acct.balance,
        status: acct.status,
        category: acct.category,
        dateOpened: '2024-01-01',
        dateOfLastActivity: now,
        dateAddedToApp: now,
        importSource: 'credit-report',
      });
    }

    setTimeout(() => {
      router.push('/accounts');
    }, 500);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Credit Report"
        description="Upload your credit report to automatically import accounts."
      />

      <WizardStepper steps={WIZARD_STEPS} currentStep={currentStep} className="mb-8" />

      <div className="mx-auto max-w-2xl">
        {currentStep === 0 && <StepUpload onComplete={handleUploadComplete} />}
        {currentStep === 1 && (
          <StepReview
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
          />
        )}
        {currentStep === 2 && (
          <StepConfirm
            selectedIds={selectedIds}
            onConfirm={handleConfirm}
            isImporting={isImporting}
          />
        )}

        {/* Navigation */}
        {currentStep > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            {currentStep === 1 && (
              <Button
                size="sm"
                onClick={() => setCurrentStep(2)}
                disabled={selectedIds.size === 0}
              >
                Next
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
