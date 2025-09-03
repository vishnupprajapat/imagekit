import CryptoJS from 'crypto-js'

/**
 * Browser-compatible ImageKit authentication parameter generator
 * Uses crypto-js instead of Node.js crypto module
 */
export interface ImageKitAuthParams {
  token: string
  expire: number
  signature: string
  publicKey: string
}

/**
 * Generate ImageKit authentication parameters in the browser
 * This replicates the functionality of ImageKit SDK's getAuthenticationParameters()
 */
export function generateImageKitAuthParams(
  publicKey: string,
  privateKey: string
): ImageKitAuthParams {
  // Generate a random token (UUID-like)
  const token = generateToken()

  // Set expire time (1 hour from now)
  const expire = Math.floor(Date.now() / 1000) + 3600

  // Create signature using HMAC-SHA1
  const signature = generateSignature(token, expire, privateKey)

  return {
    token,
    expire,
    signature,
    publicKey,
  }
}

/**
 * Generate a random token for ImageKit authentication
 * Using a UUID-like format as recommended by ImageKit
 */
function generateToken(): string {
  // Generate a UUID v4-like token without bitwise operators
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r % 4) + 8
    return v.toString(16)
  })
}

/**
 * Generate HMAC-SHA1 signature for ImageKit authentication
 * This matches the signature generation logic from ImageKit SDK
 */
function generateSignature(token: string, expire: number, privateKey: string): string {
  // Create the string to sign (token + expire)
  const stringToSign = token + expire

  // Generate HMAC-SHA1 signature using crypto-js
  const signature = CryptoJS.HmacSHA1(stringToSign, privateKey).toString()

  return signature
}

/**
 * Validate that the generated parameters are valid
 */
function validateAuthParams(params: {token: string; expire: number; signature: string}): boolean {
  // Check if token is present and non-empty
  if (!params.token || params.token.length === 0) {
    return false
  }

  // Check if expire is a valid future timestamp
  const now = Math.floor(Date.now() / 1000)
  if (!params.expire || params.expire <= now) {
    return false
  }

  // Check if signature is present and non-empty
  if (!params.signature || params.signature.length === 0) {
    return false
  }

  return true
}

// Export the validation function for testing purposes
export {validateAuthParams}
