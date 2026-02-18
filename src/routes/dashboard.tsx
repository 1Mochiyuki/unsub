import { Navigate, createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Subscription } from '@/types/dashboard'
import { ChannelCard } from '@/components/ChannelCard'
import { useSubscriptions } from '@/hooks/useSubscriptions'
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

const PAGE_SIZE_OPTIONS: Array<number | 'all'> = [50, 100, 200, 'all']
const SHOW_ALL_PAGE_SIZE = Infinity

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  validateSearch: (search) => {
    const page = Number(search.page || 1)
    const pageSize =
      search.pageSize === 'all' ? Infinity : Number(search.pageSize || 50)
    return {
      page: page < 1 ? 1 : page,
      pageSize: pageSize,
    }
  },
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
  const { page, pageSize: searchPageSize } = Route.useSearch()
  const navigate = Route.useNavigate()

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
  } = useSubscriptions({
    initialPageSize: searchPageSize === Infinity ? 50 : searchPageSize,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    if (page === 1 && isLoading) return
    fetchPage(page, searchPageSize === Infinity ? 50 : searchPageSize)
  }, [page, searchPageSize, fetchPage, isLoading])

  const filteredSubscriptions = useSearch({
    items: subscriptions,
    searchQuery,
    searchFn: (item: Subscription, query: string) =>
      item.snippet.title.toLowerCase().includes(query),
  })

  const paginatedSubscriptions = useMemo(() => {
    if (searchPageSize === Infinity) {
      return filteredSubscriptions
    }
    const startIndex = (page - 1) * searchPageSize
    const endIndex = startIndex + searchPageSize
    return filteredSubscriptions.slice(startIndex, endIndex)
  }, [filteredSubscriptions, page, searchPageSize])

  const totalPagesCount = useMemo(() => {
    if (searchPageSize === Infinity) {
      return 1
    }
    if (totalResults) {
      return Math.ceil(totalResults / searchPageSize)
    }
    return Math.ceil(filteredSubscriptions.length / searchPageSize)
  }, [totalResults, filteredSubscriptions.length, searchPageSize])

  const { selectedIds, setSelection, clearSelection, selectAll } =
    useSelection()

  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map())

  const useVirtualization = viewMode === 'list' && searchPageSize === Infinity

  const rowVirtualizer = useVirtualizer({
    count: useVirtualization ? paginatedSubscriptions.length : 0,
    getScrollElement: useVirtualization
      ? () => document.documentElement
      : () => null,
    estimateSize: () => 115,
    overscan: useVirtualization ? 10 : 0,
    enabled: useVirtualization,
  })

  const { isSelecting, selectionBox, handleMouseDown } = useDragSelection({
    onSelectionChange: setSelection,
    itemsRef,
  })

  const {
    isUnsubscribing,
    confirmation,
    failedUnsubscribes,
    confirmSingleUnsubscribe,
    handleSingleUnsubscribe,
    promptBulkUnsubscribe,
    performBulkUnsubscribe,
    retryFailedUnsubscribes,
    clearFailedUnsubscribes,
    dismissConfirmation,
  } = useUnsubscribe()

  const handlePageChange = useCallback(
    (newPage: number) => {
      navigate({ search: (prev) => ({ ...prev, page: newPage }) })
    },
    [navigate],
  )

  const handlePrefetchNext = useCallback(() => {
    prefetchPage(page, searchPageSize, totalPagesCount, isFetchingPage)
  }, [page, searchPageSize, totalPagesCount, isFetchingPage, prefetchPage])

  const handleBulkUnsubscribe = useCallback(() => {
    promptBulkUnsubscribe(selectedIds)
  }, [selectedIds, promptBulkUnsubscribe])

  const handleConfirmUnsubscribe = useCallback(async () => {
    if (confirmation?.type === 'bulk') {
      await performBulkUnsubscribe(
        selectedIds,
        subscriptions,
        removeSubscription,
        clearSelection,
        rollbackSubscription,
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

  const handlePageSizeChange = useCallback((size: number | 'all') => {
    const pageSizeValue = size === 'all' ? SHOW_ALL_PAGE_SIZE : size
    return {
      page: 1,
      pageSize: pageSizeValue === SHOW_ALL_PAGE_SIZE ? 'all' : pageSizeValue,
    }
  }, [])

  const searchBarActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
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
    ),
    [
      viewMode,
      selectedIds.size,
      isUnsubscribing,
      isLoading,
      handleBulkUnsubscribe,
    ],
  )

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
          {failedUnsubscribes.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
              <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-warning font-medium">
                    {failedUnsubscribes.length} unsubscribe
                    {failedUnsubscribes.length > 1 ? 's' : ''} failed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFailedUnsubscribes}
                    className="rounded-lg"
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      retryFailedUnsubscribes(
                        removeSubscription,
                        rollbackSubscription,
                      )
                    }
                    disabled={isUnsubscribing}
                    className="rounded-lg"
                  >
                    {isUnsubscribing ? 'Retrying...' : 'Retry'}
                  </Button>
                </div>
              </div>
            </div>
          )}
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
              actions={searchBarActions}
            />

            <SharedPagination
              currentPage={page}
              pageSize={searchPageSize}
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
            ) : viewMode === 'list' && searchPageSize === Infinity ? (
              <div className="pb-20 select-none relative">
                <div style={{ height: rowVirtualizer.getTotalSize() }}>
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
                          top: `${virtualRow.start}px`,
                          left: 0,
                          width: '100%',
                        }}
                      >
                        <ChannelCard
                          channel={sub}
                          viewMode={viewMode}
                          selectionState={
                            selectedIds.has(sub.id) ? 'selected' : 'default'
                          }
                          onUnsubscribe={() => confirmSingleUnsubscribe(sub)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : viewMode === 'list' ? (
              <div
                className="pb-20 select-none flex flex-col gap-5"
                style={{
                  minHeight: 'calc(100vh - 300px)',
                }}
              >
                {paginatedSubscriptions.map((sub, index) => (
                  <div
                    key={sub.id}
                    data-selection-item
                    data-id={sub.id}
                    data-index={index}
                    className="content-auto"
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
                      onUnsubscribe={() => confirmSingleUnsubscribe(sub)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 select-none">
                {paginatedSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    data-selection-item
                    data-id={sub.id}
                    className="content-auto"
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
                      onUnsubscribe={() => confirmSingleUnsubscribe(sub)}
                    />
                  </div>
                ))}
              </div>
            )}

            <SharedPagination
              currentPage={page}
              pageSize={searchPageSize}
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
