import ImageKit from 'imagekit'
import {SanityClient} from 'sanity'

import {directUploadToImageKit} from '../util/directUpload'
import {ConfiguredSecrets} from '../util/types'

/**
 * Creates an ImageKit client instance
 */
export function createImageKitClient(secrets: ConfiguredSecrets) {
  return new ImageKit({
    publicKey: secrets.publicKey,
    privateKey: secrets.privateKey,
    urlEndpoint: secrets.urlEndpoint,
  })
}

/**
 * Tests if the provided ImageKit credentials are valid
 */
export function testImageKitCredentials(
  client: SanityClient,
  secrets: ConfiguredSecrets
): Promise<unknown> {
  const imagekit = createImageKitClient(secrets)

  // Test credentials by trying to list files (will throw if credentials are invalid)
  return imagekit.listFiles({
    limit: 1,
  })
}

// Define the ImageKit upload response type
export interface ImageKitUploadResponse {
  fileId: string
  name: string
  url: string
  thumbnailUrl: string
  height?: number
  width?: number
  size: number
  filePath: string
  tags?: string[]
  isPrivateFile: boolean
  customCoordinates?: string
  metadata?: Record<string, unknown>
  customMetadata?: Record<string, string>
  fileType?: string
  mime?: string
  [key: string]: unknown
}

// Define the ImageKit file details response type
export interface ImageKitFileDetails {
  fileId: string
  name: string
  url: string
  thumbnailUrl?: string
  height?: number
  width?: number
  size: number
  filePath: string
  tags?: string[]
  isPrivateFile: boolean
  customCoordinates?: string
  metadata?: Record<string, unknown>
  customMetadata?: Record<string, string>
  fileType?: string
  mime?: string
  createdAt: string
  updatedAt: string
  type: string
  [key: string]: unknown
}

/**
 * Uploads a file to ImageKit using multi-approach strategy
 * This is the main entry point for all uploads
 */
export async function uploadToImageKit(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  file: File,
  options: Record<string, unknown>
): Promise<ImageKitUploadResponse> {
  // uploadToImageKit called with options

  // Get the necessary credentials
  const {publicKey, privateKey, urlEndpoint} = secrets

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('Invalid ImageKit credentials')
  }

  // Use the enhanced direct upload function
  try {
    // Using direct upload approach
    return await directUploadToImageKit(file, client, secrets, options)
  } catch (error) {
    // Upload failed
    throw new Error(`Upload failed: ${(error as Error)?.message || 'Unknown error'}`)
  }
}

/**
 * Gets file details from ImageKit
 */
export async function getFileDetails(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  fileId: string
): Promise<ImageKitFileDetails> {
  const imagekit = createImageKitClient(secrets)

  const details = await imagekit.getFileDetails(fileId)
  return {
    ...details,
    tags: details.tags || [],
    type: details.type || '',
  } as ImageKitFileDetails
}

/**
 * Gets a list of files from ImageKit
 */
export async function listFiles(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  options: Record<string, unknown> = {}
): Promise<ImageKitFileDetails[]> {
  const imagekit = createImageKitClient(secrets)

  const files = await imagekit.listFiles(options)
  return files.map((file) => ({
    ...file,
    tags: file.tags || [],
    type: file.type || '',
  })) as ImageKitFileDetails[]
}
