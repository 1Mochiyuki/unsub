import { Navigate, createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Authenticated, Unauthenticated } from 'convex/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Subscription } from '@/types/dashboard'
import { ChannelCard } from '@/components/ChannelCard'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { usePagination } from '@/hooks/usePagination'
import { useSearch } from '@/hooks/useSearch'
import { useSelection } from '@/hooks/useSelection'
import { useDragSelection } from '@/hooks/useDragSelection'
import { useUnsubscribe } from '@/hooks/useUnsubscribe'
import { EmptyState, LoadingState } from '@/components/dashboard'
import { SelectionOverlay } from '@/components/shared/SelectionOverlay'
import { SharedConfirmationDialog } from '@/components/shared/SharedConfirmationDialog'
import { SharedPagination } from '@/components/shared/SharedPagination'
import { SharedSearchBar } from '@/components/shared/SharedSearchBar'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const PAGE_SIZE_OPTIONS = [50, 100, 200]

  const {
    subscriptions,
    isLoading,
    isFetchingPage,
    totalResults,
    fetchPage,
    prefetchPage,
    cancelPrefetch,
    removeSubscription,
  } = useSubscriptions({ initialPageSize: 50 })

  const { currentPage, pageSize, setCurrentPage, setPageSize, totalPages } =
    usePagination({
      initialPage: 1,
      initialPageSize: 50,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    })

  const [searchQuery, setSearchQuery] = useState('')

  const filteredSubscriptions = useSearch({
    items: subscriptions,
    searchQuery,
    searchFn: (item: Subscription, query: string) =>
      item.snippet.title.toLowerCase().includes(query),
  })

  const paginatedSubscriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredSubscriptions.slice(startIndex, endIndex)
  }, [filteredSubscriptions, currentPage, pageSize])

  const totalPagesCount = totalPages(filteredSubscriptions.length, totalResults)

  const {
    selectedIds,
    toggleSelection,
    setSelection,
    clearSelection,
    selectAll,
    isSelected,
  } = useSelection()

  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const contentRef = useRef<HTMLDivElement>(null)

  const { isSelecting, selectionBox, handleMouseDown, scrollOffset } =
    useDragSelection({
      onSelectionChange,
      itemsRef,
      contentRef,
    })

  const {
    isUnsubscribing,
    confirmation,
    confirmSingleUnsubscribe,
    handleSingleUnsubscribe,
    promptBulkUnsubscribe,
    performBulkUnsubscribe,
    dismissConfirmation,
  } = useUnsubscribe()

  useEffect(() => {
    if (!isLoading) {
      fetchPage(currentPage, pageSize)
    }
  }, [currentPage, pageSize, fetchPage, isLoading])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrefetchNext = () => {
    prefetchPage(currentPage, pageSize, totalPagesCount, isFetchingPage)
  }

  const handleBulkUnsubscribe = () => {
    promptBulkUnsubscribe(selectedIds)
  }

  const handleConfirmUnsubscribe = async () => {
    if (confirmation?.type === 'bulk') {
      await performBulkUnsubscribe(
        selectedIds,
        subscriptions,
        removeSubscription,
        clearSelection,
      )
    } else {
      await handleSingleUnsubscribe()
    }
  }

  const handleSelectAll = () => {
    const allIds = paginatedSubscriptions.map((s) => s.id)
    selectAll(allIds)
  }

  return (
    <>
      <Authenticated>
        <div
          onMouseDown={(e) => handleMouseDown(e, selectedIds)}
          className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative"
        >
          <SelectionOverlay
            isVisible={isSelecting}
            selectionBox={selectionBox}
            scrollOffset={scrollOffset}
          />
          <div
            ref={contentRef}
            className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
          >
            <SharedSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCount={selectedIds.size}
              filteredCount={filteredSubscriptions.length}
              onSelectAll={handleSelectAll}
              onBulkAction={handleBulkUnsubscribe}
              isProcessing={isUnsubscribing}
              isLoading={isLoading}
              placeholder="Search channels..."
              actionLabel="Unsubscribe"
            />

            <SharedPagination
              currentPage={currentPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              totalPages={totalPagesCount}
              filteredCount={filteredSubscriptions.length}
              totalCount={totalResults}
              isFetching={isFetchingPage || isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={setPageSize}
              onPrefetchNext={handlePrefetchNext}
              onCancelPrefetch={cancelPrefetch}
              unitLabel="Channels"
            />

            {isLoading ? (
              <LoadingState />
            ) : filteredSubscriptions.length === 0 ? (
              <EmptyState
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
              />
            ) : (
              <div className="flex flex-col gap-3 pb-20 select-none">
                {paginatedSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    data-selection-item
                    ref={(el) => {
                      if (el) itemsRef.current.set(sub.id, el)
                      else itemsRef.current.delete(sub.id)
                    }}
                  >
                    <ChannelCard
                      channel={sub}
                      isSelected={isSelected(sub.id)}
                      onToggleSelect={() => toggleSelection(sub.id)}
                      onUnsubscribe={() => confirmSingleUnsubscribe(sub)}
                    />
                  </div>
                ))}

                {isFetchingPage && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            )}

            <SharedPagination
              currentPage={currentPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              totalPages={totalPagesCount}
              filteredCount={filteredSubscriptions.length}
              totalCount={totalResults}
              isFetching={isFetchingPage || isLoading}
              onPageChange={handlePageChange}
              onPageSizeChange={setPageSize}
              onPrefetchNext={handlePrefetchNext}
              onCancelPrefetch={cancelPrefetch}
              unitLabel="Channels"
            />

            <SharedConfirmationDialog
              open={!!confirmation?.open}
              title={
                confirmation?.type === 'bulk'
                  ? `Unsubscribe from ${confirmation?.data?.count} channels?`
                  : 'Unsubscribe from channel?'
              }
              description={
                confirmation?.type === 'bulk'
                  ? `This will remove your subscription from ${confirmation?.data?.count} channel(s).`
                  : `Are you sure you want to unsubscribe from ${confirmation?.data?.snippet?.title}?`
              }
              isProcessing={isUnsubscribing}
              onConfirm={handleConfirmUnsubscribe}
              onDismiss={dismissConfirmation}
            />
          </div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/login" />
      </Unauthenticated>
    </>
  )
}
