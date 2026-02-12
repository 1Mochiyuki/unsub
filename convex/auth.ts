import Google from '@auth/core/providers/google'
import { convexAuth } from '@convex-dev/auth/server'
import { encrypt } from './utils/encryption'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [
        Google({
            profile(googleProfile, tokens) {
                return {
                    id: googleProfile.sub,

                    name: googleProfile.name,
                    email: googleProfile.email,
                    image: googleProfile.picture,

                    access_token: tokens.access_token!,
                    refresh_token: tokens.refresh_token,
                    expires_at: tokens.expires_at,
                    expires_in: tokens.expires_in,
                }
            },
            authorization: {
                params: {
                    scope:
                        'openid profile email https://www.googleapis.com/auth/youtube.force-ssl',
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        }),
    ],
    callbacks: {
        async afterUserCreatedOrUpdated(ctx, { userId }) {
            const user = await ctx.db.get(userId)
            if (!user || !user.access_token) {
                return
            }

            const key = process.env.ENCRYPTION_KEY!
            const encryptedAccess = await encrypt(user.access_token, key)
            const encryptedRefresh = user.refresh_token
                ? await encrypt(user.refresh_token, key)
                : undefined

            await ctx.db.patch(userId, {
                access_token: encryptedAccess,
                refresh_token: encryptedRefresh,
            })
        },
    },
})
