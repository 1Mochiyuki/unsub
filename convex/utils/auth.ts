import { auth } from '../auth'
import type { ActionCtx, MutationCtx, QueryCtx } from '../_generated/server'

export async function requireAuth(ctx: ActionCtx | MutationCtx | QueryCtx) {
  const userId = await auth.getUserId(ctx)
  if (!userId) {
    throw new Error('Not authenticated')
  }
  return userId
}
