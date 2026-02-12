import Google from '@auth/core/providers/google'
import { convexAuth } from '@convex-dev/auth/server'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      profile(googleProfile, tokens) {
        return {
          id: googleProfile.sub,

          name: googleProfile.name,
          email: googleProfile.email,
          image: googleProfile.picture,

          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          expires_in: tokens.expires_in,
        }
      },
      authorization: {
        params: {
          scope:
            'openid profile email https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
})
