import { action } from './_generated/server'
import { decrypt, encrypt } from './utils/encryption'

export const testEncryption = action({
  args: {},
  handler: async () => {
    const key = process.env.ENCRYPTION_KEY
    if (!key) throw new Error('ENCRYPTION_KEY is missing from environment')

    const secretMessage = 'Hello Convex! ' + Date.now()

    console.log('1. Starting test with message:', secretMessage)

    try {
      const encrypted = await encrypt(secretMessage, key)
      console.log('2. Encrypted Hex:', encrypted)

      const decrypted = await decrypt(encrypted, key)
      console.log('3. Decrypted Message:', decrypted)

      if (secretMessage === decrypted) {
        return {
          success: true,
          message: 'Encryption/Decryption works perfectly!',
        }
      } else {
        return { success: false, error: 'Mismatch!' }
      }
    } catch (err: any) {
      console.error('Test failed:', err)
      return { success: false, error: err.message }
    }
  },
})
