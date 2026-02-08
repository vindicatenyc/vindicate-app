'use client';

import Link from 'next/link';
import { Upload, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { AccountList } from '@/components/accounts/account-list';

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Track and manage all your debt accounts."
        actions={
          <>
            <Link href="/accounts/import">
              <Button variant="outline" size="sm">
                <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Import from Credit Report
              </Button>
            </Link>
            <Link href="/accounts/new">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Add Account
              </Button>
            </Link>
          </>
        }
      />

      <AccountList />
    </div>
  );
}
