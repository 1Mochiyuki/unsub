import { useMemo, useState } from 'react'
import { useDebounce } from './useDebounce'

interface UseSearchProps<T> {
  items: Array<T>
  searchQuery: string
  searchFn: (item: T, query: string) => boolean
}

export function useSearch<T>({
  items,
  searchQuery,
  searchFn,
}: UseSearchProps<T>): Array<T> {
  const debouncedQuery = useDebounce(searchQuery, 300)

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) return items
    const query = debouncedQuery.toLowerCase()
    return items.filter((item) => searchFn(item, query))
  }, [items, debouncedQuery, searchFn])

  return filteredItems
}
