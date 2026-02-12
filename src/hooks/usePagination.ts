import { useState } from 'react'

interface UsePaginationProps {
  initialPage: number
  initialPageSize: number
  pageSizeOptions: Array<number>
}

interface UsePaginationReturn {
  currentPage: number
  pageSize: number
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  totalPages: (filteredCount: number, totalCount?: number | null) => number
  canGoBack: boolean
  canGoForward: (totalPages: number) => boolean
}

export function usePagination({
  initialPage,
  initialPageSize,
  pageSizeOptions,
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = (
    filteredCount: number,
    totalCount?: number | null,
  ): number => {
    if (totalCount) {
      return Math.ceil(totalCount / pageSize)
    }
    return Math.ceil(filteredCount / pageSize) || 1
  }

  const canGoBack = currentPage > 1

  const canGoForward = (totalPagesCount: number): boolean =>
    currentPage < totalPagesCount

  const handleSetPageSize = (size: number) => {
    if (!pageSizeOptions.includes(size)) return
    setPageSize(size)
    setCurrentPage(1)
  }

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize: handleSetPageSize,
    totalPages,
    canGoBack,
    canGoForward,
  }
}
