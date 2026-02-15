import { useState } from 'react'

export interface ConfirmationState {
  open: boolean
  type: string
  data?: any
}

interface UseConfirmationDialogReturn {
  confirmation: ConfirmationState | null
  prompt: (type: string, data?: any) => void
  dismiss: () => void
  setOpen: (open: boolean) => void
}

export function useConfirmationDialog(): UseConfirmationDialogReturn {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  )

  const prompt = (type: string, data?: any) => {
    setConfirmation({ open: true, type, data })
  }

  const dismiss = () => {
    setConfirmation(null)
  }

  const setOpen = (open: boolean) => {
    setConfirmation((prev) => {
      if (!open) return null
      return prev ? { ...prev, open } : null
    })
  }

  return {
    confirmation,
    prompt,
    dismiss,
    setOpen,
  }
}
