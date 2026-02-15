import { useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { ConfirmationState, Subscription } from '../types/dashboard'

interface UseUnsubscribeReturn {
  isUnsubscribing: boolean
  confirmation: ConfirmationState | null
  confirmSingleUnsubscribe: (sub: Subscription) => void
  handleSingleUnsubscribe: (
    onRemoveSubscription?: (id: string) => void,
    onRollbackSubscription?: (subscription: Subscription) => void,
  ) => Promise<void>
  promptBulkUnsubscribe: (selectedIds: Set<string>) => void
  performBulkUnsubscribe: (
    selectedIds: Set<string>,
    allSubscriptions: Array<Subscription>,
    onRemoveSubscription: (id: string) => void,
    onRollbackSubscription?: (subscription: Subscription) => void,
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

  const handleSingleUnsubscribe = async (
    onRemoveSubscription?: (id: string) => void,
    onRollbackSubscription?: (subscription: Subscription) => void,
  ) => {
    if (!confirmation || confirmation.type !== 'single' || !confirmation.data) {
      return
    }

    const sub = confirmation.data as Subscription
    const toastId = toast.loading(`Unsubscribing from ${sub.snippet.title}...`)

    onRemoveSubscription?.(sub.id)
    toast.success(`Unsubscribed from ${sub.snippet.title}`, { id: toastId })

    try {
      await unsubscribe({ subscriptionId: sub.id })
      await logUnsubscribe({
        channelId: sub.snippet.resourceId.channelId,
        channelTitle: sub.snippet.title,
        channelThumbnail:
          sub.snippet.thumbnails?.medium?.url ||
          sub.snippet.thumbnails?.default?.url,
      })
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to unsubscribe. Please try again.'
      toast.error(errorMessage)
      onRollbackSubscription?.(sub)
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
    onRollbackSubscription?: (subscription: Subscription) => void,
    onClearSelection: () => void,
  ) => {
    if (selectedIds.size === 0) return

    const idsToUnsub = Array.from(selectedIds)
    const removedSubscriptions = allSubscriptions.filter((s) =>
      selectedIds.has(s.id),
    )
    const toastId = toast.loading(
      `Unsubscribing from ${selectedIds.size} channels...`,
    )

    idsToUnsub.forEach((id) => onRemoveSubscription(id))
    onClearSelection()
    toast.success(`Unsubscribing from ${selectedIds.size} channels...`, {
      id: toastId,
    })

    setIsUnsubscribing(true)
    let successCount = 0
    let failCount = 0

    try {
      const BATCH_SIZE = 10
      for (let i = 0; i < idsToUnsub.length; i += BATCH_SIZE) {
        const batch = idsToUnsub.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(async (id) => {
            const sub = allSubscriptions.find((s) => s.id === id)
            if (!sub) return { success: false }

            try {
              await unsubscribe({ subscriptionId: id })
              await logUnsubscribe({
                channelId: sub.snippet.resourceId.channelId,
                channelTitle: sub.snippet.title,
                channelThumbnail:
                  sub.snippet.thumbnails?.medium?.url ||
                  sub.snippet.thumbnails?.default?.url,
              })
              return { success: true, sub }
            } catch (err) {
              console.error(
                `Failed to unsubscribe from ${sub.snippet.title}`,
                err,
              )
              return { success: false, sub }
            }
          }),
        )

        batchResults.forEach((result) => {
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        })
      }

      if (failCount === 0) {
        toast.success(
          `Successfully unsubscribed from ${successCount} channel${successCount > 1 ? 's' : ''}`,
          { id: toastId },
        )
      } else {
        toast.warning(
          `Unsubscribed from ${successCount} channel${successCount > 1 ? 's' : ''}. Failed: ${failCount}`,
          { id: toastId },
        )
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred during bulk unsubscribe'
      toast.error(errorMessage, { id: toastId })
      removedSubscriptions.forEach((sub) => onRollbackSubscription?.(sub))
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
