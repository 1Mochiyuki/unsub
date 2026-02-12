import { useAction } from 'convex/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { YouTubeSubscriptionsResponse } from '../types/dashboard'

interface UseSubscriptionsProps {
  initialPageSize: number
}

interface UseSubscriptionsReturn {
  subscriptions: Array<any>
  pageTokens: Map<number, string | null>
  isLoading: boolean
  isFetchingPage: boolean
  totalResults: number | null
  fetchPage: (page: number, size: number, isPrefetch?: boolean) => Promise<void>
  prefetchPage: (
    page: number,
    pageSize: number,
    totalPages: number,
    isFetching: boolean,
  ) => void
  cancelPrefetch: () => void
  removeSubscription: (id: string) => void
}

export function useSubscriptions({
  initialPageSize,
}: UseSubscriptionsProps): UseSubscriptionsReturn {
  const listSubscriptions = useAction(api.youtube.listSubscriptions)

  const [subscriptions, setSubscriptions] = useState<Array<any>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingPage, setIsFetchingPage] = useState(false)
  const [totalResults, setTotalResults] = useState<number | null>(null)

  const pageTokens = useRef<Map<number, string | null>>(new Map([[0, null]]))
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFetchingRef = useRef(false)
  const subscriptionsLengthRef = useRef(subscriptions.length)
  const totalResultsRef = useRef(totalResults)

  useEffect(() => {
    subscriptionsLengthRef.current = subscriptions.length
  }, [subscriptions])

  useEffect(() => {
    totalResultsRef.current = totalResults
  }, [totalResults])

  const fetchPage = useCallback(
    async (page: number, size: number, isPrefetch = false) => {
      const endIndex = page * size
      const currentLen = subscriptionsLengthRef.current
      const total = totalResultsRef.current

      if (currentLen >= endIndex) return
      if (total && currentLen >= Math.min(total, endIndex)) return

      if (isFetchingRef.current) return
      isFetchingRef.current = true

      if (!isPrefetch) setIsFetchingPage(true)

      try {
        let currentPageIndex = Math.floor(subscriptionsLengthRef.current / 50)
        let currentToken = pageTokens.current.get(currentPageIndex) ?? null

        if (currentPageIndex > 0 && currentToken === null) {
          console.warn(`No token found for page index ${currentPageIndex}`)
          return
        }

        while (subscriptionsLengthRef.current < endIndex) {
          const result = (await listSubscriptions({
            pageToken: currentToken || undefined,
          })) as YouTubeSubscriptionsResponse

          if (result.items.length === 0) break

          setSubscriptions((prev) => [...prev, ...result.items])
          subscriptionsLengthRef.current += result.items.length

          if (result.pageInfo?.totalResults) {
            setTotalResults(result.pageInfo.totalResults)
            totalResultsRef.current = result.pageInfo.totalResults
          }

          currentPageIndex++
          currentToken = result.nextPageToken || null
          pageTokens.current.set(currentPageIndex, currentToken)

          if (!currentToken) break
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error)
        if (!isPrefetch) {
          toast.error('Failed to load subscriptions. Please try again.')
        }
      } finally {
        isFetchingRef.current = false
        if (!isPrefetch) {
          setIsFetchingPage(false)
          setIsLoading(false)
        }
      }
    },
    [listSubscriptions],
  )

  const prefetchPage = useCallback(
    (
      page: number,
      pageSize: number,
      totalPages: number,
      isFetching: boolean,
    ) => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
      prefetchTimeoutRef.current = setTimeout(() => {
        if (page < (totalPages || 1) && !isFetching) {
          fetchPage(page + 1, pageSize, true)
        }
      }, 300)
    },
    [fetchPage],
  )

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }
  }, [])

  const removeSubscription = useCallback((id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  useEffect(() => {
    fetchPage(1, initialPageSize)
  }, [fetchPage, initialPageSize])

  return {
    subscriptions,
    pageTokens: pageTokens.current,
    isLoading,
    isFetchingPage,
    totalResults,
    fetchPage,
    prefetchPage,
    cancelPrefetch,
    removeSubscription,
  }
}
