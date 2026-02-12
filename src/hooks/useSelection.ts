import { useCallback, useState } from 'react'

interface UseSelectionReturn {
  selectedIds: Set<string>
  toggleSelection: (id: string) => void
  setSelection: (ids: Set<string>) => void
  clearSelection: () => void
  selectAll: (allIds: Array<string>) => void
  getSelectedCount: () => number
  isSelected: (id: string) => boolean
}

export function useSelection(): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const setSelection = useCallback((ids: Set<string>) => {
    setSelectedIds(new Set(ids))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectAll = useCallback((allIds: Array<string>) => {
    setSelectedIds((prev) => {
      if (prev.size === allIds.length && allIds.length > 0) {
        return new Set()
      }
      return new Set(allIds)
    })
  }, [])

  const getSelectedCount = useCallback(() => {
    return selectedIds.size
  }, [selectedIds])

  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id)
    },
    [selectedIds],
  )

  return {
    selectedIds,
    toggleSelection,
    setSelection,
    clearSelection,
    selectAll,
    getSelectedCount,
    isSelected,
  }
}
