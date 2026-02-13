import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

interface HeaderProps {
  title: string | ReactNode
  description: string | ReactNode
}

interface FooterProps {
  confirmLabel?: ReactNode
  cancelLabel?: string
  variant?: 'destructive' | 'default'
  isProcessing?: boolean
  onConfirm: () => void
  onDismiss: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  children,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border text-foreground">
        {children}
      </DialogContent>
    </Dialog>
  )
}

ConfirmationDialog.Header = function Header({
  title,
  description,
}: HeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  )
}

ConfirmationDialog.Footer = function Footer({
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isProcessing = false,
  onConfirm,
  onDismiss,
}: FooterProps) {
  return (
    <DialogFooter>
      <Button variant="ghost" onClick={onDismiss}>
        {cancelLabel}
      </Button>
      <Button variant={variant} onClick={onConfirm} disabled={isProcessing}>
        {isProcessing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          confirmLabel
        )}
      </Button>
    </DialogFooter>
  )
}

// Legacy export for backward compatibility
export { ConfirmationDialog as SharedConfirmationDialog }
