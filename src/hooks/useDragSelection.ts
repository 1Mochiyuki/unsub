import { useEffect, useRef, useState } from 'react'
import type { SelectionMode } from '../types/dashboard'

interface SelectionBox {
  start: { x: number; y: number }
  current: { x: number; y: number }
}

interface UseDragSelectionProps {
  onSelectionChange: (selectedIds: Set<string>) => void
  itemsRef: React.MutableRefObject<Map<string, HTMLDivElement>>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
}

interface UseDragSelectionReturn {
  isSelecting: boolean
  selectionBox: SelectionBox | null
  handleMouseDown: (e: React.MouseEvent, currentSelection: Set<string>) => void
  scrollOffset: { x: number; y: number }
}

export function useDragSelection({
  onSelectionChange,
  itemsRef,
  contentRef,
}: UseDragSelectionProps): UseDragSelectionReturn {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 })

  const selectionStartRef = useRef<{
    x: number
    y: number
    initialSelection: Set<string>
    mode: SelectionMode
    clickedItemId: string | null
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

    const start = { x: e.clientX, y: e.clientY }
    const mode = e.ctrlKey || e.metaKey ? 'TOGGLE' : 'REPLACE'

    const clickedItem = target.closest('[data-selection-item]')
    const clickedItemId = clickedItem?.getAttribute('data-id') || null

    setIsSelecting(true)
    setSelectionBox({ start: { x: start.x, y: start.y }, current: start })
    setScrollOffset({ x: window.scrollX, y: window.scrollY })

    selectionStartRef.current = {
      x: start.x,
      y: start.y,
      initialSelection: new Set(currentSelection),
      mode,
      clickedItemId,
    }

    if (mode === 'REPLACE') {
      onSelectionChange(new Set())
    }
  }

  useEffect(() => {
    if (!isSelecting) return

    const handleMouseMove = (e: MouseEvent) => {
      setSelectionBox((prev: SelectionBox | null) =>
        prev
          ? {
              ...prev,
              current: { x: e.clientX, y: e.clientY },
            }
          : null,
      )

      const start = selectionStartRef.current
      if (!start) return

      const current = { x: e.clientX, y: e.clientY }

      const boxRect = {
        left: Math.min(start.x, current.x),
        top: Math.min(start.y, current.y),
        right: Math.max(start.x, current.x),
        bottom: Math.max(start.y, current.y),
      }

      const newSelection = new Set(
        start.mode === 'TOGGLE' ? start.initialSelection : [],
      )

      itemsRef.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect()

        const isIntersecting = !(
          rect.right < boxRect.left ||
          rect.left > boxRect.right ||
          rect.bottom < boxRect.top ||
          rect.top > boxRect.bottom
        )

        if (isIntersecting) {
          if (start.mode === 'TOGGLE') {
            if (start.initialSelection.has(id)) {
              newSelection.delete(id)
            } else {
              newSelection.add(id)
            }
          } else {
            newSelection.add(id)
          }
        }
      })

      onSelectionChange(newSelection)
    }

    const handleMouseUp = (e: MouseEvent) => {
      const start = selectionStartRef.current

      if (start) {
        const diffX = e.clientX - start.x
        const diffY = e.clientY - start.y
        const dist = Math.sqrt(diffX * diffX + diffY * diffY)

        if (dist < 5) {
          if (start.clickedItemId) {
            if (start.mode === 'TOGGLE') {
              const newSelection = new Set(start.initialSelection)
              if (newSelection.has(start.clickedItemId)) {
                newSelection.delete(start.clickedItemId)
              } else {
                newSelection.add(start.clickedItemId)
              }
              onSelectionChange(newSelection)
            } else if (start.mode === 'REPLACE') {
              onSelectionChange(new Set([start.clickedItemId]))
            }
          } else if (start.mode === 'REPLACE') {
            onSelectionChange(new Set())
          }
        }
      }

      setIsSelecting(false)
      setSelectionBox(null)
      selectionStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isSelecting, itemsRef, contentRef, onSelectionChange])

  useEffect(() => {
    const handleScroll = () => {
      setScrollOffset({ x: window.scrollX, y: window.scrollY })
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return {
    isSelecting,
    selectionBox,
    handleMouseDown,
    scrollOffset,
  }
}
