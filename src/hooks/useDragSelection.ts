import { useEffect, useRef, useState } from 'react'
import type { SelectionMode } from '../types/dashboard'

export interface SelectionBox {
  start: { x: number; y: number }
  current: { x: number; y: number }
}

interface UseDragSelectionProps {
  onSelectionChange: (selectedIds: Set<string>) => void
  itemsRef: React.MutableRefObject<Map<string, HTMLDivElement>>
}

interface UseDragSelectionReturn {
  isSelecting: boolean
  selectionBox: SelectionBox | null
  handleMouseDown: (e: React.MouseEvent, currentSelection: Set<string>) => void
}

export function useDragSelection({
  onSelectionChange,
  itemsRef,
}: UseDragSelectionProps): UseDragSelectionReturn {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)

  const selectionStartRef = useRef<{
    x: number
    y: number
    offset: { left: number; top: number }
    initialSelection: Set<string>
    clickedItemId: string | null
    lastDragSelection: Set<string>
  } | null>(null)

  const handleMouseDown = (
    e: React.MouseEvent,
    currentSelection: Set<string>,
  ) => {
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[role="checkbox"]')
    ) {
      return
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const offset = {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    }

    const startRelative = {
      x: e.pageX - offset.left,
      y: e.pageY - offset.top,
    }

    const clickedItem = target.closest('[data-selection-item]')
    const clickedItemId = clickedItem?.getAttribute('data-id') || null

    setIsSelecting(true)
    setSelectionBox({
      start: startRelative,
      current: startRelative,
    })

    selectionStartRef.current = {
      x: e.pageX,
      y: e.pageY,
      offset,
      initialSelection: new Set(currentSelection),
      clickedItemId,
      lastDragSelection: new Set(currentSelection),
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting || !selectionStartRef.current) return

      const start = selectionStartRef.current
      const offset = start.offset

      const currentRelative = {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top,
      }

      setSelectionBox((prev) =>
        prev ? { ...prev, current: currentRelative } : null,
      )

      const currentPage = { x: e.pageX, y: e.pageY }

      // Calculate Viewport coordinates for intersection checking
      // (Page coord - Scroll position = Viewport coord)
      const scrollX = window.scrollX
      const scrollY = window.scrollY

      const startViewport = {
        x: start.x - scrollX,
        y: start.y - scrollY,
      }
      const currentViewport = {
        x: currentPage.x - scrollX,
        y: currentPage.y - scrollY,
      }

      const boxRect = {
        left: Math.min(startViewport.x, currentViewport.x),
        top: Math.min(startViewport.y, currentViewport.y),
        right: Math.max(startViewport.x, currentViewport.x),
        bottom: Math.max(startViewport.y, currentViewport.y),
      }

      const newSelection = new Set(start.initialSelection)

      itemsRef.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect() // Returns viewport coordinates

        const isIntersecting = !(
          rect.right < boxRect.left ||
          rect.left > boxRect.right ||
          rect.bottom < boxRect.top ||
          rect.top > boxRect.bottom
        )

        if (isIntersecting) {
          newSelection.add(id)
        }
      })

      onSelectionChange(newSelection)

      // Track the drag selection for toggle logic on mouseup
      if (selectionStartRef.current) {
        selectionStartRef.current.lastDragSelection = newSelection
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const start = selectionStartRef.current

      if (start) {
        // Use Page coordinates for distance check too
        const diffX = e.pageX - start.x
        const diffY = e.pageY - start.y
        const dist = Math.sqrt(diffX * diffX + diffY * diffY)

        if (dist < 5) {
          if (start.clickedItemId) {
            // Toggle selection based on the INITIAL selection state (when mouse went down)
            const newSelection = new Set(start.initialSelection)
            if (newSelection.has(start.clickedItemId)) {
              newSelection.delete(start.clickedItemId)
            } else {
              newSelection.add(start.clickedItemId)
            }
            onSelectionChange(newSelection)
          } else {
            // Clicked empty space - clear selection
            onSelectionChange(new Set<string>())
          }
        }
      }

      setIsSelecting(false)
      setSelectionBox(null)
      selectionStartRef.current = null
    }

    if (isSelecting) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isSelecting, onSelectionChange])

  return {
    isSelecting,
    selectionBox,
    handleMouseDown,
  }
}
