import { Navigate, createFileRoute } from '@tanstack/react-router'
import {
  Authenticated,
  Unauthenticated,
  useAction,
  useMutation,
  useQuery,
} from 'convex/react'
import { Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { historyCache } from '@/lib/storage-cache'
import {
  SelectionOverlay,
  SharedPagination,
  SharedSearchBar,
} from '@/components/shared'
import { ConfirmationDialog } from '@/components/shared/SharedConfirmationDialog'
import { useSelection } from '@/hooks/useSelection'
import { useDragSelection } from '@/hooks/useDragSelection'
import { usePagination } from '@/hooks/usePagination'
import { useSearch } from '@/hooks/useSearch'
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS: Array<number | 'all'> = [20, 50, 100, 'all']
const SHOW_ALL_PAGE_SIZE = Infinity

export const Route = createFileRoute('/history')({
  component: HistoryPage,
  staleTime: 10 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
  headers: () => ({
    'Cache-Control': 'public, max-age=600, stale-while-revalidate=600',
  }),
})

type HistoryItem = {
  _id: Id<'unsubscribed_history'>
  channelId: string
  channelTitle: string
  channelThumbnail?: string
  unsubscribedAt: number
}

function HistoryPage() {
  const history = useQuery(api.history.getHistory, {})
  const [cachedHistory, setCachedHistory] = useState<Array<any> | null>(null)

  useEffect(() => {
    if (history && history.length > 0 && !cachedHistory) {
      const cached = historyCache.get<Array<any>>('all_history_cache')
      if (cached) {
        setCachedHistory(cached)
      }
      historyCache.set('all_history_cache', history)
    }
  }, [history, cachedHistory])
  const subscribe = useAction(api.youtube.subscribe)
  const removeHistoryItem = useMutation(api.history.removeHistoryItem)
  const bulkResubscribeMutation = useMutation(api.history.bulkResubscribe)
  const bulkDeleteMutation = useMutation(api.history.bulkDelete)

  const [isDeleting, setIsDeleting] = useState(false)
  const [isResubscribing, setIsResubscribing] = useState(false)

  const invalidateHistoryCache = () => {
    historyCache.invalidate('all_history_cache')
    setCachedHistory(null)
  }

  const [searchQuery, setSearchQuery] = useState('')

  const filteredHistory = useSearch({
    items: cachedHistory || history || [],
    searchQuery,
    searchFn: (item: HistoryItem, query: string) =>
      item.channelTitle.toLowerCase().includes(query),
  })

  const { currentPage, pageSize, setCurrentPage, setPageSize, totalPages } =
    usePagination({
      initialPage: 1,
      initialPageSize: 20,
    })

  const handlePageSizeChange = (size: number | 'all') => {
    if (size === 'all') {
      setPageSize(SHOW_ALL_PAGE_SIZE)
    } else {
      setPageSize(size)
    }
  }

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredHistory.slice(startIndex, endIndex)
  }, [filteredHistory, currentPage, pageSize])

  const totalPagesCount = totalPages(filteredHistory.length)

  const {
    selectedIds,
    toggleSelection,
    addToSelection,
    selectRange,
    setSelection,
    clearSelection,
    selectAll,
    lastSelectedId,
  } = useSelection()

  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map())

  const { isSelecting, selectionBox, handleMouseDown } = useDragSelection({
    onSelectionChange: setSelection,
    itemsRef,
  })

  const { confirmation, prompt, dismiss } = useConfirmationDialog()

  const promptBulkResubscribe = () => {
    if (selectedIds.size === 0) return
    prompt('resubscribe', { count: selectedIds.size })
  }

  const promptBulkDelete = () => {
    if (selectedIds.size === 0) return
    prompt('delete', { count: selectedIds.size })
  }

  const handleConfirmResubscribe = async () => {
    const idsToRemove = Array.from(selectedIds) as Array<
      Id<'unsubscribed_history'>
    >
    const toastId = toast.loading(
      `Resubscribing to ${selectedIds.size} channels...`,
    )

    // Optimistic update - remove from UI immediately
    const tempHistory = (cachedHistory || history || []).filter(
      (h) => !selectedIds.has(h._id.toString()),
    )
    setCachedHistory(tempHistory)
    clearSelection()
    toast.success(`Resubscribing to ${selectedIds.size} channels...`, {
      id: toastId,
    })

    setIsResubscribing(true)
    try {
      const result = await bulkResubscribeMutation({
        ids: idsToRemove,
      })

      await Promise.all(
        result.channels.map((channel) =>
          subscribe({ channelId: channel.channelId }),
        ),
      )

      toast.success(
        `Resubscribed to ${result.channels.length} channel${result.channels.length > 1 ? `s` : ``}`,
        { id: toastId },
      )

      dismiss()
      invalidateHistoryCache()
    } catch (error) {
      console.error(error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to resubscribe'
      toast.error(errorMessage, { id: toastId })
      // Rollback - restore items in history
      invalidateHistoryCache()
    } finally {
      setIsResubscribing(false)
    }
  }

  const handleConfirmDelete = async () => {
    const idsToRemove = Array.from(selectedIds) as Array<
      Id<'unsubscribed_history'>
    >
    const toastId = toast.loading(
      `Removing ${selectedIds.size} history items...`,
    )

    // Optimistic update - remove from UI immediately
    const tempHistory = (cachedHistory || history || []).filter(
      (h) => !selectedIds.has(h._id.toString()),
    )
    setCachedHistory(tempHistory)
    clearSelection()
    toast.success(
      `Removed ${selectedIds.size} history item${selectedIds.size > 1 ? `s` : ``}`,
      {
        id: toastId,
      },
    )

    setIsDeleting(true)
    try {
      await bulkDeleteMutation({
        ids: idsToRemove,
      })
      invalidateHistoryCache()
    } catch (error) {
      console.error(error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to remove history items'
      toast.error(errorMessage, { id: toastId })
      // Rollback - restore items in history
      invalidateHistoryCache()
    } finally {
      setIsDeleting(false)
      dismiss()
    }
  }

  const handleConfirm = () => {
    if (confirmation?.type === 'resubscribe') {
      handleConfirmResubscribe()
    } else {
      handleConfirmDelete()
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSelectAll = () => {
    const allIds = paginatedHistory.map((h) => h._id.toString())
    selectAll(allIds)
  }

  const handleDeselectAll = () => {
    clearSelection()
  }

  const handleHistoryItemClick = (itemId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    if (e.shiftKey) {
      e.stopPropagation()
      const allIds = paginatedHistory.map((h) => h._id.toString())
      if (lastSelectedId && allIds.includes(lastSelectedId)) {
        selectRange(lastSelectedId, itemId, allIds)
      } else {
        addToSelection(itemId)
      }
    } else {
      toggleSelection(itemId)
    }
  }

  const dialogContent = useMemo(() => {
    if (!confirmation) return { title: '', description: '' }
    const count = confirmation.data?.count || 0
    if (confirmation.type === 'resubscribe') {
      return {
        title: `Resubscribe to ${count} channel(s)?`,
        description: `This will add ${count} channel(s) back to your subscriptions and remove them from history.`,
      }
    }
    return {
      title: `Delete ${count} history item(s)?`,
      description: `This will permanently remove ${count} history item(s).`,
    }
  }, [confirmation])

  const handleIndividualResubscribe = async (item: HistoryItem) => {
    const toastId = toast.loading(`Resubscribing to ${item.channelTitle}...`)

    const tempHistory = (cachedHistory || history || []).filter(
      (h) => h._id !== item._id,
    )
    setCachedHistory(tempHistory)
    toast.success(`Resubscribed to ${item.channelTitle}`, { id: toastId })

    try {
      await subscribe({ channelId: item.channelId })
      await removeHistoryItem({ id: item._id })
      invalidateHistoryCache()
    } catch (error) {
      console.error(error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to resubscribe'
      toast.error(errorMessage)
      // Rollback - restore the item in history
      invalidateHistoryCache()
    }
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
          />
          <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <SharedSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCount={selectedIds.size}
              filteredCount={filteredHistory.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              isLoading={!history}
              placeholder="Search history..."
              actions={
                <>
                  <Button
                    variant="ghost"
                    disabled={selectedIds.size === 0 || isDeleting || !history}
                    onClick={promptBulkDelete}
                    className={cn(
                      'flex-1 md:flex-none rounded-xl font-bold transition-all duration-300',
                      selectedIds.size > 0
                        ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={
                      selectedIds.size === 0 || isResubscribing || !history
                    }
                    onClick={promptBulkResubscribe}
                    className={cn(
                      'flex-1 md:flex-none rounded-xl font-bold transition-all duration-300',
                      selectedIds.size > 0
                        ? 'text-primary hover:text-primary hover:bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <Undo2 className="w-5 h-5 mr-2" />
                    Resubscribe
                  </Button>
                </>
              }
            />

            <SharedPagination
              currentPage={currentPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              totalPages={totalPagesCount}
              filteredCount={filteredHistory.length}
              isFetching={!history}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              itemName="History Items"
            />

            {!history ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton
                    key={i}
                    className="flex items-center gap-4 p-6 bg-card border border-border rounded-2xl"
                  >
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </Skeleton>
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground font-medium">
                    No history yet
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col gap-12 pb-20 select-none overflow-auto"
                style={{
                  contentVisibility: 'auto',
                  height: 'calc(100vh - 400px)',
                  minHeight: '600px',
                }}
              >
                {paginatedHistory.map((item, index) => (
                  <div
                    key={item._id}
                    data-id={item._id.toString()}
                    data-selection-item
                    className={cn(
                      'group p-6 bg-card border border-border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-400',
                      selectedIds.has(item._id.toString())
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50 hover:bg-card/80',
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                    ref={(el) => {
                      if (el) itemsRef.current.set(item._id.toString(), el)
                      else itemsRef.current.delete(item._id.toString())
                    }}
                    onClick={(e) =>
                      handleHistoryItemClick(item._id.toString(), e)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-border shrink-0">
                        <AvatarImage
                          src={item.channelThumbnail}
                          alt={item.channelTitle}
                          referrerPolicy="no-referrer"
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-lg">
                          {item.channelTitle?.slice(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary/90 transition-colors line-clamp-1">
                          {item.channelTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Unsubscribed {getRelativeTime(item.unsubscribedAt)}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleIndividualResubscribe(item)
                      }}
                      variant="default"
                      className="flex-1 md:flex-none rounded-xl"
                    >
                      Resubscribe
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <SharedPagination
              currentPage={currentPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              totalPages={totalPagesCount}
              filteredCount={filteredHistory.length}
              isFetching={!history}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              itemName="History Items"
            />

            <ConfirmationDialog
              open={!!confirmation?.open}
              onOpenChange={(open) => !open && dismiss()}
            >
              <ConfirmationDialog.Header
                title={dialogContent.title}
                description={dialogContent.description}
              />
              <ConfirmationDialog.Footer
                variant={
                  confirmation?.type === 'delete' ? 'destructive' : 'default'
                }
                confirmLabel={
                  confirmation?.type === 'delete' ? 'Delete' : 'Confirm'
                }
                isProcessing={isDeleting || isResubscribing}
                onConfirm={handleConfirm}
                onDismiss={dismiss}
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

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function getRelativeTime(timestamp: number) {
  const diff = timestamp - Date.now()
  const diffSeconds = Math.round(diff / 1000)
  const diffMinutes = Math.round(diff / (1000 * 60))
  const diffHours = Math.round(diff / (1000 * 60 * 60))
  const diffDays = Math.round(diff / (1000 * 60 * 60 * 24))

  if (Math.abs(diffSeconds) < 60) return rtf.format(diffSeconds, 'second')
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  return rtf.format(diffDays, 'day')
}
