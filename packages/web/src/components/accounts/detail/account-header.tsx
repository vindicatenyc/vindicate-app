'use client';

import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import type { Account } from '@vindicate/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';

interface AccountHeaderProps {
  account: Account;
}

export function AccountHeader({ account }: AccountHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/accounts"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to accounts"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Accounts</span>
        </Link>
        <div className="h-5 w-px bg-border" aria-hidden="true" />
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground">
              {account.creditorName}
            </h1>
            <StatusBadge status={account.status} />
          </div>
          {account.collectorName && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Currently with {account.collectorName}
            </p>
          )}
        </div>
      </div>
      <Link href={`/accounts/${account.id}?edit=true`}>
        <Button variant="outline" size="sm">
          <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Edit
        </Button>
      </Link>
    </div>
  );
}
