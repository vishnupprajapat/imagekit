import ImageKit from 'imagekit'
import type {SanityClient} from 'sanity'

import {imageKitSecretsDocumentId} from '../util/constants'

/**
 * Server-side function for ImageKit authentication
 * This generates authentication parameters for client-side uploads
 */
export async function generateImageKitAuth(client: SanityClient) {
  try {
    // Get ImageKit credentials from secrets document or environment
    const secretsData = await client.fetch(
      `*[_id == $secretsId][0]{publicKey, privateKey, urlEndpoint}`,
      {secretsId: imageKitSecretsDocumentId}
    )

    const publicKey = secretsData?.publicKey || process.env.IMAGEKIT_PUBLIC_KEY
    const privateKey = secretsData?.privateKey || process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = secretsData?.urlEndpoint || process.env.IMAGEKIT_URL_ENDPOINT

    if (!publicKey || !privateKey) {
      throw new Error('Missing ImageKit credentials')
    }

    // Create ImageKit instance and generate auth parameters
    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint: urlEndpoint || '',
    })

    const authParams = imagekit.getAuthenticationParameters()

    return {
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to generate authentication parameters: ${errorMessage}`)
  }
}
