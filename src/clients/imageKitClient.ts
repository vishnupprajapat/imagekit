import ImageKit from 'imagekit'
import {SanityClient} from 'sanity'

import {ImageKitFileDetails, ImageKitUploadResponse} from '../types/imagekit'
import {directUploadToImageKit} from '../util/directUpload'
import {ConfiguredSecrets} from '../util/types'

/**
 * ImageKit API Service Class
 */
export class ImageKitService {
  private client: typeof ImageKit | any

  constructor(secrets: ConfiguredSecrets) {
    if (!secrets.publicKey || !secrets.privateKey || !secrets.urlEndpoint) {
      throw new Error('Invalid ImageKit credentials')
    }

    // Initialize the server-side SDK
    this.client = new ImageKit({
      publicKey: secrets.publicKey,
      privateKey: secrets.privateKey,
      urlEndpoint: secrets.urlEndpoint,
    })
  }

  /**
   * Tests if the provided ImageKit credentials are valid
   */
  async testCredentials(): Promise<unknown> {
    return this.client.listFiles({
      limit: 1,
    })
  }

  /**
   * Gets file details from ImageKit
   */
  async getFileDetails(fileId: string): Promise<ImageKitFileDetails> {
    const details = await this.client.getFileDetails(fileId)
    return {
      ...details,
      tags: details.tags || [],
      type: details.type || '',
    } as unknown as ImageKitFileDetails
  }

  /**
   * Generates a URL from ImageKit
   */
  getUrl(options: any): string {
    return this.client.url(options)
  }

  /**
   * Deletes a file from ImageKit
   */
  deleteFile(fileId: string) {
    return this.client.deleteFile(fileId)
  }

  /**
   * Generates authentication parameters
   */
  getAuthenticationParameters() {
    return this.client.getAuthenticationParameters()
  }

  /**
   * Gets a list of files from ImageKit
   */
  async listFiles(options: Record<string, unknown> = {}): Promise<ImageKitFileDetails[]> {
    const files = await this.client.listFiles(options)
    return files.map((file: any) => ({
      ...file,
      tags: file.tags || [],
      type: file.type || '',
    })) as unknown as ImageKitFileDetails[]
  }
}

/**
 * Uploads a file to ImageKit using multi-approach strategy
 * This is the main entry point for all browser-side uploads
 */
export async function uploadToImageKit(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  file: File,
  options: Record<string, unknown>
): Promise<ImageKitUploadResponse> {
  const {publicKey, privateKey, urlEndpoint} = secrets

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('Invalid ImageKit credentials')
  }

  // Use the enhanced direct upload function
  try {
    return await directUploadToImageKit(file, client, secrets, options)
  } catch (error) {
    throw new Error(`Upload failed: ${(error as Error)?.message || 'Unknown error'}`)
  }
}
