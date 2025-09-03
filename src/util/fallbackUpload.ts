// This file implements a fallback upload approach using the Node.js ImageKit SDK
// in case the browser-based approaches fail

import ImageKit from 'imagekit'
import type {SanityClient} from 'sanity'

import type {ImageKitUploadResponse} from '../clients/imageKitClient'
import {buildCustomMetadata} from './buildCustomMetadata'
import type {ConfiguredSecrets} from './types'

/**
 * Converts a File object to a base64 string without the data URL prefix
 */
async function fileToBase64(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., 'data:image/jpeg;base64,')
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      } else {
        resolve(null)
      }
    }
    reader.onerror = (error) => {
      reject(error)
    }
  })
}

/**
 * Uploads a file to ImageKit using the Node.js SDK directly
 * This is a fallback method that doesn't rely on the React SDK
 */
export async function fallbackUploadToImageKit(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  file: File,
  options: Record<string, unknown>
): Promise<ImageKitUploadResponse> {
  // Using fallback Node.js SDK upload method

  // Create a new ImageKit instance with credentials
  const imagekit = new ImageKit({
    publicKey: secrets.publicKey,
    privateKey: secrets.privateKey,
    urlEndpoint: secrets.urlEndpoint,
  })

  // Convert file to base64
  const base64Data = await fileToBase64(file)
  if (!base64Data) {
    throw new Error('Failed to convert file to base64')
  }

  // Prepare upload parameters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ImageKit upload params have complex nested types
  const uploadParams: any = {
    file: base64Data,
    fileName: options.fileName,
    folder: options.folder || '/',
    isPrivateFile: options.isPrivate || false,
    tags: options.tags || [],
    useUniqueFileName: options.useUniqueFileName !== false,
  }

  // Add custom metadata (normalized)
  const customMetadata = buildCustomMetadata(
    options.customMetadata as Record<string, unknown> | undefined
  )
  if (customMetadata) {
    uploadParams.customMetadata = customMetadata
    // Custom metadata added (normalized)
  }

  // Perform the upload using the Node.js SDK
  const response = await imagekit.upload(uploadParams)
  // Fallback upload successful
  return response as unknown as ImageKitUploadResponse
}
