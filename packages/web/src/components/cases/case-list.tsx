'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Briefcase, Plus, Search } from 'lucide-react';
import type { CaseType, VindicateCaseStatus } from '@vindicate/shared';
import { CASE_STATUS_CONFIG } from '@vindicate/shared';
import { useCases } from '@/hooks/use-cases';
import type { CaseFilters } from '@/hooks/use-cases';
import { CaseCard } from './case-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1';

const CASE_TYPE_OPTIONS: { value: CaseType; label: string }[] = [
  { value: 'credit-bureau-dispute', label: 'Credit Bureau Dispute' },
  { value: 'debt-validation', label: 'Debt Validation' },
  { value: 'fdcpa-complaint', label: 'FDCPA Complaint' },
  { value: 'lawsuit-defendant', label: 'Lawsuit (Defendant)' },
  { value: 'lawsuit-plaintiff', label: 'Lawsuit (Plaintiff)' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'cfpb-complaint', label: 'CFPB Complaint' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: VindicateCaseStatus[] = [
  'draft', 'filed', 'under-review', 'response-received',
  'hearing-scheduled', 'in-progress', 'resolved', 'escalated', 'closed',
];

interface CaseListProps {
  className?: string;
}

export function CaseList({ className }: CaseListProps) {
  const { getFilteredCases } = useCases();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<CaseType | ''>('');
  const [filterStatus, setFilterStatus] = useState<VindicateCaseStatus | ''>('');

  const filters = useMemo<CaseFilters>(() => ({
    type: filterType || undefined,
    status: filterStatus || undefined,
    search: search || undefined,
  }), [filterType, filterStatus, search]);

  const filteredCases = useMemo(
    () => getFilteredCases(filters, { field: 'dateFiled', direction: 'desc' }),
    [getFilteredCases, filters]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(INPUT_CLASS, 'pl-9')}
            aria-label="Search cases"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as CaseType | '')}
          className={cn(INPUT_CLASS, 'max-w-[200px]')}
          aria-label="Filter by case type"
        >
          <option value="">All Types</option>
          {CASE_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as VindicateCaseStatus | '')}
          className={cn(INPUT_CLASS, 'max-w-[200px]')}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{CASE_STATUS_CONFIG[status].label}</option>
          ))}
        </select>
      </div>

      {/* Results count + New Case button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
        </p>
        <Button size="sm" onClick={() => console.log('New case form — coming soon')}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Case
        </Button>
      </div>

      {/* Case grid */}
      {filteredCases.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map(caseItem => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No cases match"
          description="Try adjusting your filters, or create your first case."
        />
      )}
    </div>
  );
}
