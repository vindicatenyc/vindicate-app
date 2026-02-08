'use client';

import { PageHeader } from '@/components/ui/page-header';
import { AccountForm } from '@/components/accounts/account-form';

export default function NewAccountPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Account"
        description="Manually add a new debt account to track."
      />

      <AccountForm />
    </div>
  );
}
