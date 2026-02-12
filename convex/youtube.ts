import { v } from 'convex/values'
import { action, internalMutation, query } from './_generated/server'
import { api, internal } from './_generated/api'
import { auth } from './auth'
import { encrypt, decrypt } from '../src/lib/encryption.node'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

export const updateUserTokens = internalMutation({
  args: {
    userId: v.id('users'),
    access_token: v.string(),
    expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    if (!ENCRYPTION_KEY) {
      throw new Error('Encryption key not configured')
    }
    const encryptedToken = encrypt(args.access_token, ENCRYPTION_KEY)
    await ctx.db.patch(args.userId, {
      access_token: encryptedToken,
      expires_at: args.expires_at,
    })
  },
})

async function checkRateLimit(ctx: any, key: string) {
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
      `Rate limit exceeded. Try again in ${Math.ceil(result.retryAfter / 1000)}s`,
    )
  }
}

async function refreshAccessToken(
  ctx: any,
  userId: any,
  refreshToken: string,
): Promise<string> {
  const clientId = process.env.AUTH_GOOGLE_ID
  const clientSecret = process.env.AUTH_GOOGLE_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Configuration error')
  }

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    console.error('Token refresh failed', await response.text())
    throw new Error('Authentication failed')
  }

  const tokens = await response.json()
  const newAccessToken = tokens.access_token
  const expiresIn = tokens.expires_in
  const newExpiresAt = Date.now() + expiresIn * 1000

  await ctx.runMutation(internal.youtube.updateUserTokens, {
    userId,
    access_token: newAccessToken,
    expires_at: newExpiresAt,
  })

  return newAccessToken
}

async function getValidAccessToken(ctx: any): Promise<string> {
  const userId = await auth.getUserId(ctx)
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const user = await ctx.runQuery(internal.users.getUserSecrets, { userId })

  if (!user || !user.access_token) {
    throw new Error('Authentication required')
  }

  const { access_token, refresh_token, expires_at } = user

  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured')
  }

  const decryptedToken = decrypt(access_token, ENCRYPTION_KEY)

  const isExpired = expires_at ? Date.now() >= expires_at - 300000 : false

  if (isExpired && refresh_token) {
    return await refreshAccessToken(ctx, userId, refresh_token)
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
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

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
      console.error('YouTube List Error', await response.text())
      throw new Error('Failed to fetch subscriptions')
    }

    return await response.json()
  },
})

export const unsubscribe = action({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

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
      console.error('YouTube Unsubscribe Error', await response.text())
      throw new Error('Failed to unsubscribe')
    }

    return { success: true }
  },
})

export const subscribe = action({
  args: {
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

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
      console.error('YouTube Subscribe Error', await response.text())
      throw new Error('Failed to subscribe')
    }

    return await response.json()
  },
})

// Revoke Google tokens securely
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
        ? decrypt(user.access_token, ENCRYPTION_KEY)
        : null
      const decryptedRefreshToken = user.refresh_token
        ? decrypt(user.refresh_token, ENCRYPTION_KEY)
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
