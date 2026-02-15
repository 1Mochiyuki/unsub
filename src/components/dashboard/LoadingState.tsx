import { Skeleton } from '@/components/ui/skeleton'

export function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border rounded-2xl bg-card animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${i * 30}ms`, animationDuration: '400ms' }}
        >
          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-3/4 max-w-xs" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <Skeleton className="h-8 w-12 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
