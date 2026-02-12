import { v } from 'convex/values'
import { invalidateSessions } from '@convex-dev/auth/server'
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server'
import { internal } from './_generated/api'
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

export const deleteUserData = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const userId = args.userId

    const history = await ctx.db
      .query('unsubscribed_history')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .collect()

    for (const item of history) {
      await ctx.db.delete(item._id)
    }

    const rateLimitKeys = [`list:${userId}`, `sub:${userId}`, `unsub:${userId}`]
    for (const key of rateLimitKeys) {
      const rateLimit = await ctx.db
        .query('rate_limits')
        .withIndex('by_key', (q) => q.eq('key', key))
        .unique()
      if (rateLimit) {
        await ctx.db.delete(rateLimit._id)
      }
    }

    await ctx.db.delete(userId)
  },
})

export const getAuthAccountsForUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', args.userId))
      .collect()
    return accounts
  },
})

export const deleteAuthAccount = internalMutation({
  args: { accountId: v.id('authAccounts') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.accountId)
  },
})

export const deleteAuthDataForUser = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const authAccounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', args.userId))
      .collect()

    for (const account of authAccounts) {
      const verificationCodes = await ctx.db
        .query('authVerificationCodes')
        .withIndex('accountId', (q) => q.eq('accountId', account._id))
        .collect()

      for (const code of verificationCodes) {
        await ctx.db.delete(code._id)
      }
    }

    for (const account of authAccounts) {
      await ctx.db.delete(account._id)
    }
  },
})

export const deleteAccount = action({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const secrets = await ctx.runQuery(internal.users.getUserSecrets, {
      userId,
    })
    if (!secrets) {
      throw new Error('User secrets not found')
    }

    try {
      await invalidateSessions(ctx, { userId })

      await ctx.runMutation(internal.users.deleteAuthDataForUser, { userId })

      await ctx.runMutation(internal.users.deleteUserData, { userId })
    } catch (error) {
      console.error('Failed to delete account:', error)
      throw new Error('Failed to delete account')
    }
  },
})
