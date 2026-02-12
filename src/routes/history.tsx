import { Navigate, createFileRoute } from '@tanstack/react-router'
import {
  Authenticated,
  Unauthenticated,
  useAction,
  useMutation,
  useQuery,
} from 'convex/react'
import { Trash2, Undo2, Youtube } from 'lucide-react'
import { toast } from 'sonner'
import { useMemo, useRef, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import {
  SelectionOverlay,
  SharedConfirmationDialog,
  SharedPagination,
  SharedSearchBar,
} from '@/components/shared'
import { useSelection } from '@/hooks/useSelection'
import { useDragSelection } from '@/hooks/useDragSelection'
import { usePagination } from '@/hooks/usePagination'
import { useSearch } from '@/hooks/useSearch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

type HistoryItem = {
  _id: Id<'unsubscribed_history'>
  channelId: string
  channelTitle: string
  unsubscribedAt: number
}

function HistoryPage() {
  const PAGE_SIZE_OPTIONS = [20, 50, 100]

  const history = useQuery(api.history.getHistory)
  const subscribe = useAction(api.youtube.subscribe)
  const removeHistoryItem = useMutation(api.history.removeHistoryItem)
  const bulkResubscribeMutation = useMutation(api.history.bulkResubscribe)
  const bulkDeleteMutation = useMutation(api.history.bulkDelete)

  const [isDeleting, setIsDeleting] = useState(false)
  const [isResubscribing, setIsResubscribing] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const filteredHistory = useSearch({
    items: history || [],
    searchQuery,
    searchFn: (item: HistoryItem, query: string) =>
      item.channelTitle.toLowerCase().includes(query),
  })

  const { currentPage, pageSize, setCurrentPage, setPageSize, totalPages } =
    usePagination({
      initialPage: 1,
      initialPageSize: 20,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    })

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredHistory.slice(startIndex, endIndex)
  }, [filteredHistory, currentPage, pageSize])

  const totalPagesCount = totalPages(filteredHistory.length)

  const { selectedIds, setSelection, clearSelection, selectAll, isSelected } =
    useSelection()

  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const contentRef = useRef<HTMLDivElement>(null)

  const { isSelecting, selectionBox, handleMouseDown } = useDragSelection({
    onSelectionChange: setSelection,
    itemsRef,
    contentRef,
  })

  const [confirmation, setConfirmation] = useState<{
    open: boolean
    type: 'resubscribe' | 'delete'
    data?: any
  } | null>(null)

  const dismissConfirmation = () => setConfirmation(null)

  const promptBulkResubscribe = () => {
    if (selectedIds.size === 0) return
    setConfirmation({
      open: true,
      type: 'resubscribe',
      data: { count: selectedIds.size },
    })
  }

  const promptBulkDelete = () => {
    if (selectedIds.size === 0) return
    setConfirmation({
      open: true,
      type: 'delete',
      data: { count: selectedIds.size },
    })
  }

  const handleConfirmResubscribe = async () => {
    setIsResubscribing(true)
    try {
      const result = await bulkResubscribeMutation({
        ids: Array.from(selectedIds) as Array<Id<'unsubscribed_history'>>,
      })

      for (const channel of result.channels) {
        await subscribe({ channelId: channel.channelId })
        toast.success(`Resubscribed to ${channel.channelTitle}`)
      }

      clearSelection()
      setConfirmation(null)
    } catch (error) {
      console.error(error)
      toast.error('Failed to resubscribe')
    } finally {
      setIsResubscribing(false)
    }
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await bulkDeleteMutation({
        ids: Array.from(selectedIds) as Array<Id<'unsubscribed_history'>>,
      })
      toast.success(`Removed ${selectedIds.size} history item(s)`)
      clearSelection()
      setConfirmation(null)
    } catch (error) {
      console.error(error)
      toast.error('Failed to remove history items')
    } finally {
      setIsDeleting(false)
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
    try {
      await subscribe({ channelId: item.channelId })
      await removeHistoryItem({ id: item._id })
      toast.success(`Resubscribed to ${item.channelTitle}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to resubscribe')
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
          <div
            ref={contentRef}
            className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
          >
            <SharedSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCount={selectedIds.size}
              filteredCount={filteredHistory.length}
              onSelectAll={handleSelectAll}
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
              onPageSizeChange={setPageSize}
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
              <div className="flex flex-col gap-3 pb-20 select-none">
                {paginatedHistory.map((item) => (
                  <div
                    key={item._id}
                    data-id={item._id.toString()}
                    data-selection-item
                    ref={(el) => {
                      if (el) itemsRef.current.set(item._id.toString(), el)
                      else itemsRef.current.delete(item._id.toString())
                    }}
                    className={cn(
                      'group p-6 bg-card border border-border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all cursor-pointer',
                      isSelected(item._id.toString())
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50 hover:bg-card/80',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive border border-destructive/20 shrink-0">
                        <Youtube className="w-6 h-6" />
                      </div>
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
              onPageSizeChange={setPageSize}
              itemName="History Items"
            />

            <SharedConfirmationDialog
              open={!!confirmation?.open}
              title={dialogContent.title}
              description={dialogContent.description}
              confirmLabel={
                confirmation?.type === 'delete' ? 'Delete' : 'Confirm'
              }
              isProcessing={isDeleting || isResubscribing}
              onConfirm={handleConfirm}
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

function getRelativeTime(timestamp: number) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
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
