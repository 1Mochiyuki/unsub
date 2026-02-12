import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { auth } from './auth'
import { requireAuth } from './utils/auth'
import type { Id } from './_generated/dataModel'

export const logUnsubscribe = mutation({
  args: {
    channelId: v.string(),
    channelTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    await ctx.db.insert('unsubscribed_history', {
      userId,
      channelId: args.channelId,
      channelTitle: args.channelTitle,
      unsubscribedAt: Date.now(),
    })
  },
})

export const getHistory = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) {
      return null
    }

    const history = await ctx.db
      .query('unsubscribed_history')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .order('desc')
      .take(100)

    return history
  },
})

export const removeHistoryItem = mutation({
  args: {
    id: v.id('unsubscribed_history'),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const item = await ctx.db.get(args.id)
    if (!item || item.userId !== userId) {
      throw new Error('Not found or unauthorized')
    }

    await ctx.db.delete(args.id)
  },
})

export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id('unsubscribed_history')),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    if (args.ids.length > 100) {
      throw new Error('Too many items')
    }

    for (const id of args.ids) {
      const item = await ctx.db.get(id)
      if (item && item.userId === userId) {
        await ctx.db.delete(id)
      }
    }
  },
})

export const bulkResubscribe = mutation({
  args: {
    ids: v.array(v.id('unsubscribed_history')),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    if (args.ids.length > 50) {
      throw new Error('Too many items')
    }

    const items = await Promise.all(args.ids.map((id) => ctx.db.get(id)))

    const validItems = items.filter(
      (item): item is NonNullable<(typeof items)[number]> =>
        item !== null && item.userId === userId,
    )

    for (const item of validItems) {
      await ctx.db.delete(item._id)
    }

    return {
      channels: validItems.map((item) => ({
        channelId: item.channelId,
        channelTitle: item.channelTitle,
      })),
    }
  },
})
