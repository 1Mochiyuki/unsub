// @use node
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// IV length for AES-256-GCM (standard is 12 bytes)
const IV_LENGTH = 12
// Auth tag length for GCM mode
const AUTH_TAG_LENGTH = 16

export function encrypt(text: string, keyHex: string): string {
  try {
    const key = Buffer.from(keyHex, 'hex')
    const iv = randomBytes(IV_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ])

    return Buffer.concat([iv, encrypted, cipher.getAuthTag()]).toString('hex')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export function decrypt(encryptedHex: string, keyHex: string): string {
  try {
    const key = Buffer.from(keyHex, 'hex')
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex')

    const iv = encryptedBuffer.subarray(0, IV_LENGTH)
    const authTag = encryptedBuffer.subarray(
      encryptedBuffer.length - AUTH_TAG_LENGTH,
      encryptedBuffer.length,
    )
    const encryptedData = encryptedBuffer.subarray(
      IV_LENGTH,
      encryptedBuffer.length - AUTH_TAG_LENGTH,
    )

    const decipher = createDecipheriv(ALGORITHM, key, iv, authTag)

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

export function validateKey(key: string): boolean {
  return /^[0-9a-f]{64}$/.test(key)
}
