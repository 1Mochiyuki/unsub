import { Search, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  searchQuery: string
  onClearSearch: () => void
}

export function EmptyState({ searchQuery, onClearSearch }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-muted/30 rounded-3xl border border-dashed">
      <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center ring-1 ring-border">
        {searchQuery ? (
          <Search className="w-10 h-10 text-muted" />
        ) : (
          <Youtube className="w-10 h-10 text-muted" />
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground">
          {searchQuery
            ? 'No matching channels found'
            : 'No subscriptions found'}
        </h3>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          {searchQuery
            ? `We couldn't find any channels matching "${searchQuery}"`
            : "You don't have any active YouTube subscriptions."}
        </p>
      </div>
      {searchQuery && (
        <Button
          variant="outline"
          onClick={onClearSearch}
          className="rounded-xl border-muted bg-background hover:bg-muted/50 text-muted-foreground"
        >
          Clear Search
        </Button>
      )}
    </div>
  )
}
