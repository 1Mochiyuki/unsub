import { useState } from 'react'
import { ChevronFirst, ChevronLast } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface DashboardPaginationProps {
  currentPage: number
  pageSize: number
  pageSizeOptions: Array<number>
  totalPages: number
  filteredCount: number
  totalCount?: number | null
  isFetching: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onPrefetchNext: () => void
  onCancelPrefetch: () => void
}

export function DashboardPagination({
  currentPage,
  pageSize,
  pageSizeOptions,
  totalPages,
  filteredCount,
  totalCount,
  isFetching,
  onPageChange,
  onPageSizeChange,
  onPrefetchNext,
  onCancelPrefetch,
}: DashboardPaginationProps) {
  const [jumpInput, setJumpInput] = useState('')
  const [showJumpInput, setShowJumpInput] = useState(false)

  const handleJump = () => {
    const page = parseInt(jumpInput)
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
      setShowJumpInput(false)
      setJumpInput('')
    }
  }

  const handleJumpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleJump()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowJumpInput(false)
      setJumpInput('')
    }
  }

  const canGoFirst = currentPage > 1
  const canGoLast = currentPage < totalPages

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 pb-8 border-t"
    >
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * pageSize + 1, filteredCount)} -{' '}
          {Math.min(currentPage * pageSize, filteredCount)} of {filteredCount}{' '}
          Channels
          {totalCount &&
            totalCount > filteredCount &&
            ` (total: ${totalCount})`}
        </span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-32.5 bg-background border focus:ring-primary/30 text-muted-foreground">
            <SelectValue placeholder="50" />
          </SelectTrigger>
          <SelectContent className="bg-background border">
            {pageSizeOptions.map((size) => (
              <SelectItem
                key={size}
                value={size.toString()}
                className="text-foreground hover:bg-muted"
              >
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Pagination className="justify-end w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (canGoFirst && !isFetching) {
                  onPageChange(1)
                }
              }}
              disabled={!canGoFirst || isFetching}
              className="h-9 w-9"
              aria-label="First page"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
          </PaginationItem>

          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1 && !isFetching) {
                  onPageChange(currentPage - 1)
                }
              }}
              className={cn(
                currentPage === 1 || isFetching
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer',
              )}
              aria-label="Previous page"
            />
          </PaginationItem>

          <PaginationItem>
            {showJumpInput ? (
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onKeyDown={handleJumpKeyDown}
                onBlur={handleJump}
                className="w-20 h-9 text-center bg-background border"
                placeholder={`1-${totalPages}`}
                autoFocus
              />
            ) : (
              <button
                onClick={() => setShowJumpInput(true)}
                className="text-sm text-muted-foreground px-4 hover:text-foreground transition-colors"
                disabled={isFetching}
              >
                Page {currentPage} of {totalPages || 1}
              </button>
            )}
          </PaginationItem>

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < (totalPages || 1) && !isFetching) {
                  onPageChange(currentPage + 1)
                }
              }}
              className={cn(
                currentPage >= (totalPages || 1) || isFetching
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer',
              )}
              aria-label="Next page"
            />
          </PaginationItem>

          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (canGoLast && !isFetching) {
                  onPageChange(totalPages || 1)
                }
              }}
              onMouseEnter={onPrefetchNext}
              onMouseLeave={onCancelPrefetch}
              disabled={!canGoLast || isFetching}
              className="h-9 w-9"
              aria-label="Last page"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
