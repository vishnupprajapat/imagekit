// This file provides a direct upload approach for ImageKit in browser environments

import {upload as reactUpload} from '@imagekit/react'
import type {SanityClient} from 'sanity'

import type {ImageKitUploadResponse} from '../clients/imageKitClient'
import type {ConfiguredSecrets} from '../util/types'
import {buildCustomMetadata} from './buildCustomMetadata'
import {fallbackUploadToImageKit} from './fallbackUpload'

interface UploadOptions {
  fileName?: string
  folder?: string
  isPrivate?: boolean
  tags?: string[]
  useUniqueFileName?: boolean
  customMetadata?: Record<string, unknown>
  onProgress?: (event: {loaded: number; total: number}) => void
  [key: string]: unknown
}

/**
 * Converts a File object to a base64 string for upload
 */
async function fileToBase64(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
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
 * Direct upload function for browser environments using the ImageKit React SDK
 * Uses the Sanity API route for authentication
 */
export async function directUploadToImageKit(
  file: File,
  client: SanityClient,
  secrets: ConfiguredSecrets,
  options: UploadOptions
): Promise<ImageKitUploadResponse> {
  // Starting upload to ImageKit using Sanity API route

  // Get the necessary credentials
  const {publicKey, urlEndpoint} = secrets

  if (!publicKey || !urlEndpoint) {
    throw new Error('Invalid ImageKit credentials')
  }

  // Convert file to base64 for upload
  const base64Data = await fileToBase64(file)
  if (!base64Data) {
    throw new Error('Failed to convert file to base64')
  }

  // File converted to base64, preparing to upload

  try {
    // Getting authentication parameters from Sanity Studio API route

    // For Studio routes, we need to use fetch API with relative URL
    // client.request() would try to call the Sanity API, not the Studio route
    const authApiResponse = await fetch('/api/imagekit/auth', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!authApiResponse.ok) {
      throw new Error(
        `Failed to fetch authentication parameters: ${authApiResponse.status} ${authApiResponse.statusText}`
      )
    }

    const authResponse = await authApiResponse.json()

    // Authentication parameters received

    if (!authResponse.token || !authResponse.signature || !authResponse.expire) {
      throw new Error('Invalid authentication parameters received from server')
    }

    const uploadParams: Record<string, unknown> = {
      file: base64Data,
      fileName: options.fileName,
      folder: options.folder || '/',
      isPrivateFile: options.isPrivate || false,
      tags: options.tags || [],
      useUniqueFileName: options.useUniqueFileName !== false,
      publicKey: publicKey,
      token: authResponse.token,
      signature: authResponse.signature,
      expire: authResponse.expire,
      onProgress: (event: {loaded: number; total: number}) => {
        if (options.onProgress) {
          options.onProgress(event)
        }
        // Upload progress tracking available
      },
    }

    // Add custom metadata (normalized)
    const customMetadata = buildCustomMetadata(
      options.customMetadata as Record<string, unknown> | undefined
    )
    if (customMetadata) {
      uploadParams.customMetadata = customMetadata
      // Custom metadata added for React SDK
    }

    // Starting upload with authentication parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await reactUpload(uploadParams as any)
    // Upload successful
    return response as unknown as ImageKitUploadResponse
  } catch (error) {
    // Upload failed using API route authentication

    // Fallback: Use Node.js SDK directly via server action
    return await fallbackUploadToImageKit(client, secrets, file, options)
  }
}
