import { Loader2 } from 'lucide-react'
import type { ConfirmationState } from '../types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UnsubscribeDialogProps {
  confirmation: ConfirmationState | null
  isUnsubscribing: boolean
  onConfirm: () => void
  onDismiss: () => void
}

export function UnsubscribeDialog({
  confirmation,
  isUnsubscribing,
  onConfirm,
  onDismiss,
}: UnsubscribeDialogProps) {
  if (!confirmation?.open) return null

  return (
    <Dialog
      open={confirmation?.open}
      onOpenChange={(open) => !open && onDismiss()}
    >
      <DialogContent className="bg-background border text-foreground">
        <DialogHeader>
          <DialogTitle>
            {confirmation.type === 'bulk'
              ? `Unsubscribe from ${confirmation.data?.count} channels?`
              : 'Unsubscribe from channel?'}
          </DialogTitle>
          <DialogDescription>
            {confirmation.type === 'bulk'
              ? `This will remove your subscription from ${confirmation.data?.count} channel(s).`
              : `Are you sure you want to unsubscribe from ${confirmation.data?.snippet?.title}?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onDismiss}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isUnsubscribing}
          >
            {isUnsubscribing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
