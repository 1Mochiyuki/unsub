import { useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { ConfirmationState, Subscription } from '../types/dashboard'

interface FailedUnsubscribe {
  subscription: Subscription
  error?: string
}

interface UseUnsubscribeReturn {
  isUnsubscribing: boolean
  confirmation: ConfirmationState | null
  failedUnsubscribes: Array<FailedUnsubscribe>
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
    onClearSelection: () => void,
    onRollbackSubscription?: (subscription: Subscription) => void,
  ) => Promise<void>
  retryFailedUnsubscribes: (
    onRemoveSubscription: (id: string) => void,
    onRollbackSubscription?: (subscription: Subscription) => void,
  ) => Promise<void>
  clearFailedUnsubscribes: () => void
  dismissConfirmation: () => void
}

export function useUnsubscribe(): UseUnsubscribeReturn {
  const unsubscribe = useAction(api.youtube.unsubscribe)
  const logUnsubscribe = useMutation(api.history.logUnsubscribe)

  const [isUnsubscribing, setIsUnsubscribing] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  )
  const [failedUnsubscribes, setFailedUnsubscribes] = useState<
    Array<FailedUnsubscribe>
  >([])

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
      setFailedUnsubscribes((prev) => [
        ...prev,
        { subscription: sub, error: errorMessage },
      ])
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
    onRollbackSubscription?: (subscription: Subscription) => void,
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
    const failed: Array<FailedUnsubscribe> = []

    try {
      const BATCH_SIZE = 10
      for (let i = 0; i < idsToUnsub.length; i += BATCH_SIZE) {
        const batch = idsToUnsub.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(async (id) => {
            const sub = allSubscriptions.find((s) => s.id === id)
            if (!sub) return { success: false, sub: null }

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
              const errorMsg =
                err instanceof Error ? err.message : 'Unknown error'
              return { success: false, sub, error: errorMsg }
            }
          }),
        )

        batchResults.forEach((result) => {
          if (result.success) {
            successCount++
          } else if (result.sub) {
            failed.push({ subscription: result.sub, error: result.error })
            onRollbackSubscription?.(result.sub)
          }
        })
      }

      if (failed.length === 0) {
        toast.success(
          `Successfully unsubscribed from ${successCount} channel${successCount > 1 ? 's' : ''}`,
          { id: toastId },
        )
      } else {
        setFailedUnsubscribes((prev) => [...prev, ...failed])
        toast.warning(
          `Unsubscribed from ${successCount}. Failed: ${failed.length}. Click retry to try again.`,
          { id: toastId, duration: 10000 },
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

  const retryFailedUnsubscribes = async (
    onRemoveSubscription: (id: string) => void,
    onRollbackSubscription?: (subscription: Subscription) => void,
  ) => {
    if (failedUnsubscribes.length === 0) return

    const toRetry = [...failedUnsubscribes]
    setFailedUnsubscribes([])

    const toastId = toast.loading(
      `Retrying ${toRetry.length} failed unsubscribe${toRetry.length > 1 ? 's' : ''}...`,
    )

    setIsUnsubscribing(true)
    let successCount = 0
    const stillFailed: Array<FailedUnsubscribe> = []

    try {
      for (const { subscription: sub } of toRetry) {
        onRemoveSubscription(sub.id)
      }

      const BATCH_SIZE = 10
      for (let i = 0; i < toRetry.length; i += BATCH_SIZE) {
        const batch = toRetry.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(async ({ subscription: sub }) => {
            try {
              await unsubscribe({ subscriptionId: sub.id })
              await logUnsubscribe({
                channelId: sub.snippet.resourceId.channelId,
                channelTitle: sub.snippet.title,
                channelThumbnail:
                  sub.snippet.thumbnails?.medium?.url ||
                  sub.snippet.thumbnails?.default?.url,
              })
              return { success: true, sub }
            } catch (err) {
              console.error(`Retry failed for ${sub.snippet.title}`, err)
              const errorMsg =
                err instanceof Error ? err.message : 'Unknown error'
              return { success: false, sub, error: errorMsg }
            }
          }),
        )

        batchResults.forEach((result) => {
          if (result.success) {
            successCount++
          } else if (result.sub) {
            stillFailed.push({ subscription: result.sub, error: result.error })
            onRollbackSubscription?.(result.sub)
          }
        })
      }

      if (stillFailed.length === 0) {
        toast.success(
          `Successfully unsubscribed from all ${successCount} channel${successCount > 1 ? 's' : ''}`,
          { id: toastId },
        )
      } else {
        setFailedUnsubscribes(stillFailed)
        toast.warning(
          `Retried ${toRetry.length}: ${successCount} succeeded, ${stillFailed.length} still failed`,
          { id: toastId, duration: 10000 },
        )
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Retry failed'
      toast.error(errorMessage, { id: toastId })
      toRetry.forEach(({ subscription: sub }) => onRollbackSubscription?.(sub))
      setFailedUnsubscribes(toRetry)
    } finally {
      setIsUnsubscribing(false)
    }
  }

  const clearFailedUnsubscribes = () => {
    setFailedUnsubscribes([])
  }

  const dismissConfirmation = () => {
    setConfirmation(null)
  }

  return {
    isUnsubscribing,
    confirmation,
    failedUnsubscribes,
    confirmSingleUnsubscribe,
    handleSingleUnsubscribe,
    promptBulkUnsubscribe,
    performBulkUnsubscribe,
    retryFailedUnsubscribes,
    clearFailedUnsubscribes,
    dismissConfirmation,
  }
}
