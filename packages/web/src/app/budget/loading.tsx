import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      {/* Income/Expense sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-20 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
