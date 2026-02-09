import { Skeleton } from '@/components/ui/skeleton';

export default function AccountsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      {/* Account cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-3 flex gap-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
