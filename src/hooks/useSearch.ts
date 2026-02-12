import { useMemo } from 'react'

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
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items
    const query = searchQuery.toLowerCase()
    return items.filter((item) => searchFn(item, query))
  }, [items, searchQuery, searchFn])

  return filteredItems
}
