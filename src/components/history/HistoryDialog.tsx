import { Loader2, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface HistoryDialogProps {
  confirmation: ConfirmationState | null
  isDeleting: boolean
  isResubscribing: boolean
  onConfirm: () => void
  onDismiss: () => void
}

export interface ConfirmationState {
  open: boolean
  type: 'resubscribe' | 'delete'
  data?: any
}

export function HistoryDialog({
  confirmation,
  isDeleting,
  isResubscribing,
  onConfirm,
  onDismiss,
}: HistoryDialogProps) {
  if (!confirmation?.open) return null

  return (
    <Dialog
      open={confirmation?.open}
      onOpenChange={(open) => !open && onDismiss()}
    >
      <DialogContent className="bg-background border text-foreground">
        <DialogHeader>
          <DialogTitle>
            {confirmation.type === 'resubscribe'
              ? `Resubscribe to ${confirmation.data?.count} channel(s)?`
              : `Delete ${confirmation.data?.count} history item(s)?`}
          </DialogTitle>
          <DialogDescription>
            {confirmation.type === 'resubscribe'
              ? `This will add ${confirmation.data?.count} channel(s) back to your subscriptions and remove them from history.`
              : `This will permanently remove ${confirmation.data?.count} history item(s).`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onDismiss}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting || isResubscribing}
          >
            {confirmation.type === 'delete' && isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : confirmation.type === 'resubscribe' && isResubscribing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : confirmation.type === 'delete' ? (
              <Trash2 className="w-4 h-4 mr-2" />
            ) : (
              <Undo2 className="w-4 h-4 mr-2" />
            )}
            {confirmation.type === 'delete' ? 'Delete' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
