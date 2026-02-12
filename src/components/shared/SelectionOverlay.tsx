interface Point {
  x: number
  y: number
}

interface SelectionBox {
  start: Point
  current: Point
}

interface SelectionOverlayProps {
  isVisible: boolean
  selectionBox: SelectionBox | null
  scrollOffset: { x: number; y: number }
}

export function SelectionOverlay({
  isVisible,
  selectionBox,
  scrollOffset,
}: SelectionOverlayProps) {
  if (!isVisible || !selectionBox) return null

  const left =
    Math.min(selectionBox.start.x, selectionBox.current.x) - scrollOffset.x
  const top =
    Math.min(selectionBox.start.y, selectionBox.current.y) - scrollOffset.y
  const width = Math.abs(selectionBox.current.x - selectionBox.start.x)
  const height = Math.abs(selectionBox.current.y - selectionBox.start.y)

  return (
    <div
      className="fixed border-2 border-primary bg-primary/10 z-50 pointer-events-none shadow-primary/50"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  )
}
