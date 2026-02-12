import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SharedConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isProcessing: boolean
  onConfirm: () => void
  onDismiss: () => void
  variant?: 'destructive' | 'default'
}

export function SharedConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isProcessing,
  onConfirm,
  onDismiss,
  variant = 'destructive',
}: SharedConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent className="bg-background border text-foreground">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  )
}
