import { useState } from 'react'
import { useAction } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { SharedConfirmationDialog } from '../shared/SharedConfirmationDialog'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteAccount = useAction(api.users.deleteAccount)
  const { signOut } = useAuthActions()

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      await signOut()
      toast.success('Account deleted successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete account. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <SharedConfirmationDialog
      open={open}
      onDismiss={() => onOpenChange(false)}
      onConfirm={handleConfirm}
      title="Delete Account"
      description="This action cannot be undone. This will permanently delete your account and remove all your data from our servers."
      confirmLabel={
        <span className="flex items-center">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </span>
      }
      cancelLabel="Cancel"
      isProcessing={isDeleting}
      variant="destructive"
    />
  )
}
