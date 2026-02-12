import { v } from 'convex/values'
import { internalQuery, query } from './_generated/server'
import { auth } from './auth'

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) {
      return null
    }
    const user = await ctx.db.get(userId)
    if (!user) {
      return null
    }
    return {
      _id: user._id,
      name: user.name || null,
      email: user.email || null,
      image: user.image || null,
    }
  },
})

export const getUserSecrets = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) return null
    return {
      access_token: user.access_token,
      refresh_token: user.refresh_token,
      expires_at: user.expires_at,
    }
  },
})
