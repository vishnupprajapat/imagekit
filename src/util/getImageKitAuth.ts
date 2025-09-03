/**
 * Utility function for getting ImageKit authentication parameters from the Sanity API
 * This can be reused across multiple components that need to upload to ImageKit
 */

/**
 * Interface for ImageKit authentication parameters
 */
export interface ImageKitAuthParams {
  token: string
  expire: number
  signature: string
  publicKey: string
}

/**
 * Get authentication parameters from the Sanity API endpoint
 * @returns Promise resolving to authentication parameters
 */
export async function getImageKitAuthParams(): Promise<ImageKitAuthParams> {
  try {
    // Call the Sanity Studio API endpoint to get auth parameters
    // Using fetch API for Studio routes instead of client.request
    const apiResponse = await fetch(`/api/imagekit/auth`)

    if (!apiResponse.ok) {
      throw new Error(
        `Failed to fetch authentication parameters: ${apiResponse.status} ${apiResponse.statusText}`
      )
    }

    const response = await apiResponse.json()

    // Validate the response
    if (
      !response ||
      !response.token ||
      !response.signature ||
      !response.expire ||
      !response.publicKey
    ) {
      throw new Error('Invalid authentication response from server')
    }

    return {
      token: response.token,
      expire: response.expire,
      signature: response.signature,
      publicKey: response.publicKey,
    }
  } catch (error) {
    throw new Error(`Failed to get authentication parameters: ${(error as Error).message}`)
  }
}

/**
 * Utility function for uploading to ImageKit using authentication parameters
 * This is a wrapper around the @imagekit/react upload function
 *
 * @example
 * // Import the function
 * import { upload as imageKitUpload } from '@imagekit/react';
 * import { getImageKitAuthParams } from '../util/imageKitAuth';
 *
 * // Get auth parameters and upload
 * const auth = await getImageKitAuthParams(client);
 * const result = await imageKitUpload({
 *   file,
 *   fileName: 'example.jpg',
 *   publicKey: auth.publicKey,
 *   token: auth.token,
 *   signature: auth.signature,
 *   expire: auth.expire
 * });
 */
