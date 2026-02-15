import { Navigate, createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
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
import { ConfirmationDialog } from '@/components/shared/SharedConfirmationDialog'
import { SharedPagination } from '@/components/shared/SharedPagination'
import { SharedSearchBar } from '@/components/shared/SharedSearchBar'
import { ViewToggle } from '@/components/shared/ViewToggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS: Array<number | 'all'> = [50, 100, 200, 'all']
const SHOW_ALL_PAGE_SIZE = Infinity

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  loader: async () => {
    await new Promise<void>((resolve) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          resolve()
        })
      } else {
        setTimeout(() => {
          resolve()
        }, 0)
      }
    })
    return {}
  },
  staleTime: 10 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
  headers: () => ({
    'Cache-Control': 'public, max-age=600, stale-while-revalidate=600',
  }),
})

function DashboardPage() {
  const {
    subscriptions,
    isLoading,
    isFetchingPage,
    totalResults,
    fetchPage,
    prefetchPage,
    cancelPrefetch,
    removeSubscription,
    rollbackSubscription,
  } = useSubscriptions({ initialPageSize: 50 })

  const { currentPage, pageSize, setCurrentPage, setPageSize, totalPages } =
    usePagination({
      initialPage: 1,
      initialPageSize: 50,
    })

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

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
  } = useSelection()

  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map())

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: paginatedSubscriptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 115,
    overscan: 5,
  })

  const { isSelecting, selectionBox, handleMouseDown } = useDragSelection({
    onSelectionChange: setSelection,
    itemsRef,
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

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePrefetchNext = useCallback(() => {
    prefetchPage(currentPage, pageSize, totalPagesCount, isFetchingPage)
  }, [currentPage, pageSize, totalPagesCount, isFetchingPage, prefetchPage])

  const handleBulkUnsubscribe = useCallback(() => {
    promptBulkUnsubscribe(selectedIds)
  }, [selectedIds, promptBulkUnsubscribe])

  const handleConfirmUnsubscribe = useCallback(async () => {
    if (confirmation?.type === 'bulk') {
      await performBulkUnsubscribe(
        selectedIds,
        subscriptions,
        removeSubscription,
        rollbackSubscription,
        clearSelection,
      )
    } else {
      await handleSingleUnsubscribe(removeSubscription, rollbackSubscription)
    }
  }, [
    confirmation,
    selectedIds,
    subscriptions,
    removeSubscription,
    rollbackSubscription,
    clearSelection,
  ])

  const handleSelectAll = useCallback(() => {
    const allIds = subscriptions.map((s) => s.id)
    selectAll(allIds)
  }, [subscriptions, selectAll])

  const handleDeselectAll = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  const handlePageSizeChange = useCallback(async (size: number | 'all') => {
    if (size === 'all') {
      setPageSize(SHOW_ALL_PAGE_SIZE)
    } else {
      setPageSize(size)
    }
  }, [])

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
          />
          <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <SharedSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCount={selectedIds.size}
              filteredCount={filteredSubscriptions.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onBulkAction={handleBulkUnsubscribe}
              isProcessing={isUnsubscribing}
              isLoading={isLoading}
              placeholder="Search channels..."
              actionLabel="Unsubscribe"
              actions={
                <div className="flex items-center gap-2">
                  <ViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                  <Button
                    variant={selectedIds.size > 0 ? 'destructive' : 'secondary'}
                    disabled={!selectedIds.size || isUnsubscribing || isLoading}
                    onClick={handleBulkUnsubscribe}
                    className="rounded-xl font-bold transition-all duration-200"
                  >
                    {selectedIds.size > 0
                      ? `Unsubscribe (${selectedIds.size})`
                      : 'Unsubscribe'}
                  </Button>
                </div>
              }
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
              onPageSizeChange={handlePageSizeChange}
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
            ) : viewMode === 'list' ? (
              <div
                ref={parentRef}
                className="pb-20 select-none flex flex-col gap-16"
                style={{
                  contentVisibility: 'auto',
                  height: 'calc(100vh - 400px)',
                  minHeight: '600px',
                  overflow: 'auto',
                  contain: 'layout style paint',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const sub = paginatedSubscriptions[virtualRow.index]
                  return (
                    <div
                      key={sub.id}
                      data-selection-item
                      data-id={sub.id}
                      data-index={virtualRow.index}
                      ref={(el) => {
                        if (el) itemsRef.current.set(sub.id, el)
                        else itemsRef.current.delete(sub.id)
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <ChannelCard
                        channel={sub}
                        viewMode={viewMode}
                        selectionState={
                          selectedIds.has(sub.id) ? 'selected' : 'default'
                        }
                        onToggleSelect={() => toggleSelection(sub.id)}
                        onUnsubscribe={() => confirmSingleUnsubscribe(sub)}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 select-none">
                {paginatedSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    data-selection-item
                    data-id={sub.id}
                    ref={(el) => {
                      if (el) itemsRef.current.set(sub.id, el)
                      else itemsRef.current.delete(sub.id)
                    }}
                  >
                    <ChannelCard
                      channel={sub}
                      viewMode={viewMode}
                      selectionState={
                        selectedIds.has(sub.id) ? 'selected' : 'default'
                      }
                      onToggleSelect={() => toggleSelection(sub.id)}
                      onUnsubscribe={() => confirmSingleUnsubscribe(sub)}
                    />
                  </div>
                ))}
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
              onPageSizeChange={handlePageSizeChange}
              onPrefetchNext={handlePrefetchNext}
              onCancelPrefetch={cancelPrefetch}
              unitLabel="Channels"
            />

            <ConfirmationDialog
              open={!!confirmation?.open}
              onOpenChange={(open) => !open && dismissConfirmation()}
            >
              <ConfirmationDialog.Header
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
              />
              <ConfirmationDialog.Footer
                variant="destructive"
                isProcessing={isUnsubscribing}
                onConfirm={handleConfirmUnsubscribe}
                onDismiss={dismissConfirmation}
              />
            </ConfirmationDialog>
          </div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/login" />
      </Unauthenticated>
    </>
  )
}
