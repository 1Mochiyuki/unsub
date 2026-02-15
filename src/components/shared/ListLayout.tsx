import type { SelectionBox } from '@/components/shared/SelectionOverlay'
import { SelectionOverlay } from '@/components/shared/SelectionOverlay'
import { SharedPagination } from '@/components/shared/SharedPagination'
import { SharedSearchBar } from '@/components/shared/SharedSearchBar'

interface ListLayoutProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCount: number
  filteredCount: number
  isLoading: boolean
  isProcessing?: boolean
  onSelectAll: () => void
  onDeselectAll: () => void
  children: React.ReactNode
  pageSize: number
  pageSizeOptions: Array<number | 'all'>
  currentPage: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number | 'all') => void
  totalPages: number
  isFetching?: boolean
  onPrefetchNext?: () => void
  onCancelPrefetch?: () => void
  unitLabel?: string
  itemName?: string
  placeholder?: string
  actions?: React.ReactNode
  selectionOverlay: {
    isVisible: boolean
    selectionBox: SelectionBox | null
  }
  onMouseDown?: (e: React.MouseEvent) => void
}

export function ListLayout({
  searchQuery,
  onSearchChange,
  selectedCount,
  filteredCount,
  isLoading,
  isProcessing,
  onSelectAll,
  onDeselectAll,
  children,
  pageSize,
  pageSizeOptions,
  currentPage,
  onPageChange,
  onPageSizeChange,
  totalPages,
  isFetching,
  onPrefetchNext,
  onCancelPrefetch,
  unitLabel = 'Items',
  itemName,
  placeholder = 'Search...',
  actions,
  selectionOverlay,
  onMouseDown,
}: ListLayoutProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative"
    >
      <SelectionOverlay
        isVisible={selectionOverlay.isVisible}
        selectionBox={selectionOverlay.selectionBox}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <SharedSearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCount={selectedCount}
          filteredCount={filteredCount}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          isProcessing={isProcessing}
          isLoading={isLoading}
          placeholder={placeholder}
          actions={actions}
        />

        <SharedPagination
          currentPage={currentPage}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          totalPages={totalPages}
          filteredCount={filteredCount}
          isFetching={isFetching || isLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onPrefetchNext={onPrefetchNext}
          onCancelPrefetch={onCancelPrefetch}
          unitLabel={unitLabel}
          itemName={itemName}
        />

        {children}
      </div>
    </div>
  )
}
