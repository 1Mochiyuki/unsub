import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SharedSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCount: number
  filteredCount: number
  onSelectAll: () => void
  onBulkAction?: () => void
  isProcessing?: boolean
  isLoading: boolean
  placeholder?: string
  actionLabel?: string
  actions?: React.ReactNode
}

export function SharedSearchBar({
  searchQuery,
  onSearchChange,
  selectedCount,
  filteredCount,
  onSelectAll,
  onBulkAction,
  isProcessing,
  isLoading,
  placeholder = 'Search...',
  actionLabel = 'Unsubscribe',
  actions,
}: SharedSearchBarProps) {
  const showSelectedCount = selectedCount > 0
  const isAllSelected = selectedCount === filteredCount && filteredCount > 0
  const hasSelection = selectedCount > 0

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="sticky top-4 z-50 bg-card/80 backdrop-blur-xl border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl transition-all duration-300"
    >
      <div className="relative w-full md:w-72 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder={placeholder}
          className="pl-10 bg-background border focus:border-primary/30 rounded-xl h-12 text-base"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {showSelectedCount && (
          <span className="text-sm text-primary font-medium hidden md:block">
            {selectedCount} selected
          </span>
        )}
        <Button
          variant="ghost"
          onClick={onSelectAll}
          disabled={isLoading || filteredCount === 0}
          className="flex-1 md:flex-none text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </Button>
        {actions ? (
          actions
        ) : (
          <Button
            variant={hasSelection ? 'destructive' : 'secondary'}
            disabled={!hasSelection || isProcessing || isLoading}
            onClick={onBulkAction}
            className={cn(
              'flex-1 md:flex-none rounded-xl font-bold transition-all duration-300',
              hasSelection
                ? 'bg-destructive/10 text-destructive-foreground hover:bg-destructive/20 border-destructive/20'
                : 'bg-secondary text-muted-foreground border-muted',
            )}
          >
            {hasSelection ? `${actionLabel} (${selectedCount})` : actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
