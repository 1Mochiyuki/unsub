import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    access_token: v.optional(v.string()),
    refresh_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    expires_in: v.optional(v.number()),
  }).index('email', ['email']),
  unsubscribed_history: defineTable({
    userId: v.id('users'),
    channelId: v.string(),
    channelTitle: v.string(),
    channelThumbnail: v.optional(v.string()),
    unsubscribedAt: v.number(),
  }).index('by_user_id', ['userId']),
  rate_limits: defineTable({
    key: v.string(),
    count: v.number(),
    expireAt: v.number(),
  }).index('by_key', ['key']),
})
