import { v } from 'convex/values'
import { query } from './_generated/server'
import { auth } from './auth'

export const getUserProfile = query({
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
      email: user.email || null,
      name: user.name || null,
      image: user.image || null,
    }
  },
})
