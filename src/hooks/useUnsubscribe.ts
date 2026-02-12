import { useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { ConfirmationState, Subscription } from '../types/dashboard'

interface UseUnsubscribeReturn {
  isUnsubscribing: boolean
  confirmation: ConfirmationState | null
  confirmSingleUnsubscribe: (sub: Subscription) => void
  handleSingleUnsubscribe: () => Promise<void>
  promptBulkUnsubscribe: (selectedIds: Set<string>) => void
  performBulkUnsubscribe: (
    selectedIds: Set<string>,
    allSubscriptions: Array<Subscription>,
    onRemoveSubscription: (id: string) => void,
    onClearSelection: () => void,
  ) => Promise<void>
  dismissConfirmation: () => void
}

export function useUnsubscribe(): UseUnsubscribeReturn {
  const unsubscribe = useAction(api.youtube.unsubscribe)
  const logUnsubscribe = useMutation(api.history.logUnsubscribe)

  const [isUnsubscribing, setIsUnsubscribing] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  )

  const confirmSingleUnsubscribe = (sub: Subscription) => {
    setConfirmation({
      open: true,
      type: 'single',
      data: sub,
    })
  }

  const handleSingleUnsubscribe = async () => {
    if (!confirmation || confirmation.type !== 'single' || !confirmation.data) {
      return
    }

    const sub = confirmation.data as Subscription
    setIsUnsubscribing(true)
    const toastId = toast.loading(`Unsubscribing from ${sub.snippet.title}...`)

    try {
      await unsubscribe({ subscriptionId: sub.id })
      await logUnsubscribe({
        channelId: sub.snippet.resourceId.channelId,
        channelTitle: sub.snippet.title,
      })

      toast.success(`Unsubscribed from ${sub.snippet.title}`, { id: toastId })
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      toast.error('Failed to unsubscribe. Please try again.', { id: toastId })
    } finally {
      setIsUnsubscribing(false)
      setConfirmation(null)
    }
  }

  const promptBulkUnsubscribe = (selectedIds: Set<string>) => {
    if (selectedIds.size === 0) return
    setConfirmation({
      open: true,
      type: 'bulk',
      data: { count: selectedIds.size },
    })
  }

  const performBulkUnsubscribe = async (
    selectedIds: Set<string>,
    allSubscriptions: Array<Subscription>,
    onRemoveSubscription: (id: string) => void,
    onClearSelection: () => void,
  ) => {
    if (selectedIds.size === 0) return

    setIsUnsubscribing(true)
    const toastId = toast.loading(
      `Unsubscribing from ${selectedIds.size} channels...`,
    )

    let successCount = 0
    let failCount = 0

    const idsToUnsub = Array.from(selectedIds)
    const newSubscriptions = [...allSubscriptions]

    try {
      for (const id of idsToUnsub) {
        const sub = allSubscriptions.find((s) => s.id === id)
        if (!sub) continue

        try {
          await unsubscribe({ subscriptionId: id })
          await logUnsubscribe({
            channelId: sub.snippet.resourceId.channelId,
            channelTitle: sub.snippet.title,
          })

          const index = newSubscriptions.findIndex((s) => s.id === id)
          if (index !== -1) newSubscriptions.splice(index, 1)

          successCount++
          onRemoveSubscription(id)
        } catch (err) {
          console.error(`Failed to unsubscribe from ${sub.snippet.title}`, err)
          failCount++
        }
      }

      onClearSelection()

      if (failCount === 0) {
        toast.success(
          `Successfully unsubscribed from ${successCount} channels`,
          { id: toastId },
        )
      } else {
        toast.warning(
          `Unsubscribed from ${successCount} channels. Failed: ${failCount}`,
          { id: toastId },
        )
      }
    } catch (error) {
      toast.error('An error occurred during bulk unsubscribe', { id: toastId })
    } finally {
      setIsUnsubscribing(false)
      setConfirmation(null)
    }
  }

  const dismissConfirmation = () => {
    setConfirmation(null)
  }

  return {
    isUnsubscribing,
    confirmation,
    confirmSingleUnsubscribe,
    handleSingleUnsubscribe,
    promptBulkUnsubscribe,
    performBulkUnsubscribe,
    dismissConfirmation,
  }
}
