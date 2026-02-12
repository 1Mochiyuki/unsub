const IV_LENGTH = 12

function hexToUint8Array(hex: string): Uint8Array {
  const len = hex.length / 2
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function importKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = hexToUint8Array(keyHex)
  return await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(text: string, keyHex: string): Promise<string> {
  try {
    const key = await importKey(keyHex)
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const encoded = new TextEncoder().encode(text)

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded,
    )

    // Result of encrypt is an ArrayBuffer, convert to Uint8Array to combine
    const encryptedArray = new Uint8Array(encrypted)
    const combined = new Uint8Array(iv.length + encryptedArray.length)
    combined.set(iv)
    combined.set(encryptedArray, iv.length)

    return uint8ArrayToHex(combined)
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export async function decrypt(
  encryptedHex: string,
  keyHex: string,
): Promise<string> {
  try {
    const key = await importKey(keyHex)
    const encryptedBuffer = hexToUint8Array(encryptedHex)

    // Subarray gives us a view. Web Crypto handles these views correctly.
    const iv = new Uint8Array(encryptedBuffer.subarray(0, IV_LENGTH))
    const encryptedData = new Uint8Array(encryptedBuffer.subarray(IV_LENGTH))

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData,
    )

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}
