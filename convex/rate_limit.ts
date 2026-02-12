import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

export const checkAndIncrementRateLimit = internalMutation({
  args: {
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const record = await ctx.db
      .query('rate_limits')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()

    if (!record || record.expireAt < now) {
      if (record) await ctx.db.delete(record._id)
      await ctx.db.insert('rate_limits', {
        key: args.key,
        count: 1,
        expireAt: now + args.windowMs,
      })
      return { allowed: true }
    }

    if (record.count >= args.limit) {
      return { allowed: false, retryAfter: record.expireAt - now }
    }

    await ctx.db.patch(record._id, {
      count: record.count + 1,
    })

    return { allowed: true }
  },
})
