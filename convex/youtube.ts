import { v } from 'convex/values'
import { action, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { auth } from './auth'
import { decrypt, encrypt } from './utils/encryption'
import { requireAuth } from './utils/auth'
import { handleApiError } from './utils/api'
import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ENCRYPTION_KEY } from './config'
import type { ActionCtx, MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

export const updateUserTokens = internalMutation({
  args: {
    userId: v.id('users'),
    access_token: v.string(),
    expires_at: v.number(),
    refresh_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Tokens must be pre-encrypted by the calling action
    await ctx.db.patch(args.userId, {
      access_token: args.access_token,
      expires_at: args.expires_at,
      ...(args.refresh_token && { refresh_token: args.refresh_token }),
    })
  },
})

async function checkRateLimit(ctx: ActionCtx | MutationCtx, key: string) {
  const result = await ctx.runMutation(
    internal.rate_limit.checkAndIncrementRateLimit,
    {
      key,
      limit: 100, // 100 requests
      windowMs: 60 * 1000, // per minute
    },
  )

  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded. Try again in ${Math.ceil((result.retryAfter ?? 0) / 1000)}s`,
    )
  }
}

async function refreshAccessToken(
  ctx: ActionCtx,
  userId: Id<'users'>,
  refreshToken: string,
): Promise<string> {
  if (!AUTH_GOOGLE_ID || !AUTH_GOOGLE_SECRET) {
    throw new Error('Configuration error')
  }

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: AUTH_GOOGLE_ID,
      client_secret: AUTH_GOOGLE_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    await handleApiError(response, 'Token refresh')
  }

  const tokens = await response.json()
  const newAccessToken = tokens.access_token
  const expiresIn = tokens.expires_in
  const newExpiresAt = Date.now() + expiresIn * 1000

  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured')
  }
  const encryptedToken = await encrypt(newAccessToken, ENCRYPTION_KEY)
  const encryptedRefreshToken = tokens.refresh_token
    ? await encrypt(tokens.refresh_token, ENCRYPTION_KEY)
    : undefined

  await ctx.runMutation(internal.youtube.updateUserTokens, {
    userId,
    access_token: encryptedToken,
    expires_at: newExpiresAt,
    refresh_token: encryptedRefreshToken,
  })

  return newAccessToken
}

async function getValidAccessToken(ctx: ActionCtx): Promise<string> {
  const userId = await requireAuth(ctx)

  const user = await ctx.runQuery(internal.users.getUserSecrets, { userId })

  if (!user || !user.access_token) {
    throw new Error('Authentication required')
  }

  const { access_token, refresh_token, expires_at } = user

  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured')
  }

  const decryptedToken = await decrypt(access_token, ENCRYPTION_KEY)

  const isExpired = expires_at ? Date.now() >= expires_at - 300000 : false

  if (isExpired && refresh_token) {
    const decryptedRefreshToken = await decrypt(refresh_token, ENCRYPTION_KEY)
    return refreshAccessToken(ctx, userId, decryptedRefreshToken)
  }

  if (isExpired && !refresh_token) {
    throw new Error('Session expired')
  }

  return decryptedToken
}

export const listSubscriptions = action({
  args: {
    pageToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    await checkRateLimit(ctx, `list:${userId}`)

    const token = await getValidAccessToken(ctx)
    const url = new URL(`${YOUTUBE_API_BASE}/subscriptions`)

    url.searchParams.set('mine', 'true')
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('maxResults', '50')

    if (args.pageToken) {
      url.searchParams.set('pageToken', args.pageToken)
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      await handleApiError(response, 'YouTube List')
    }

    return response.json()
  },
})

export const unsubscribe = action({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    await checkRateLimit(ctx, `unsub:${userId}`)

    const token = await getValidAccessToken(ctx)
    const url = new URL(`${YOUTUBE_API_BASE}/subscriptions`)
    url.searchParams.set('id', args.subscriptionId)

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 204) {
      return { success: true }
    }

    if (!response.ok) {
      await handleApiError(response, 'YouTube Unsubscribe')
    }

    return { success: true }
  },
})

export const subscribe = action({
  args: {
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    if (!args.channelId.match(/^UC[\w-]{22}$/)) {
      throw new Error('Invalid channel ID')
    }

    await checkRateLimit(ctx, `sub:${userId}`)

    const token = await getValidAccessToken(ctx)
    const url = `${YOUTUBE_API_BASE}/subscriptions?part=snippet`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: args.channelId,
          },
        },
      }),
    })

    if (!response.ok) {
      await handleApiError(response, 'YouTube Subscribe')
    }

    return response.json()
  },
})

export const revokeGoogleToken = action({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return

    if (!ENCRYPTION_KEY) {
      throw new Error('Encryption key not configured')
    }

    try {
      const user = await ctx.runQuery(internal.users.getUserSecrets, { userId })
      if (!user) return

      const decryptedToken = user.access_token
        ? await decrypt(user.access_token, ENCRYPTION_KEY)
        : null
      const decryptedRefreshToken = user.refresh_token
        ? await decrypt(user.refresh_token, ENCRYPTION_KEY)
        : null

      if (decryptedToken) {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: decryptedToken }),
        }).catch(console.error)
      }

      if (decryptedRefreshToken) {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: decryptedRefreshToken }),
        }).catch(console.error)
      }

      await ctx.runMutation(internal.youtube.clearUserTokens, { userId })
    } catch (error) {
      console.error('Error revoking token:', error)
    }
  },
})

export const clearUserTokens = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      access_token: undefined,
      refresh_token: undefined,
      expires_at: undefined,
      expires_in: undefined,
    })
  },
})
