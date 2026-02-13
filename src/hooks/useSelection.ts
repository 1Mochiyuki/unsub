import { useCallback, useState, useRef } from 'react'

interface UseSelectionReturn {
  selectedIds: Set<string>
  toggleSelection: (id: string) => void
  addToSelection: (id: string) => void
  setSelection: (ids: Set<string>) => void
  clearSelection: () => void
  selectAll: (allIds: Array<string>) => void
  selectRange: (fromId: string, toId: string, allIds: Array<string>) => void
  getSelectedCount: () => number
  isSelected: (id: string) => boolean
  lastSelectedId: string | null
}

export function useSelection(): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const lastSelectedIdRef = useRef<string | null>(null)

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
    lastSelectedIdRef.current = id
  }, [])

  const addToSelection = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id))
    lastSelectedIdRef.current = id
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

  const selectRange = useCallback((fromId: string, toId: string, allIds: Array<string>) => {
    const fromIndex = allIds.indexOf(fromId)
    const toIndex = allIds.indexOf(toId)

    if (fromIndex === -1 || toIndex === -1) return

    const start = Math.min(fromIndex, toIndex)
    const end = Math.max(fromIndex, toIndex)
    const rangeIds = allIds.slice(start, end + 1)

    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      rangeIds.forEach((id) => newSet.add(id))
      return newSet
    })
    lastSelectedIdRef.current = toId
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
    addToSelection,
    setSelection,
    clearSelection,
    selectAll,
    selectRange,
    getSelectedCount,
    isSelected,
    lastSelectedId: lastSelectedIdRef.current,
  }
}
