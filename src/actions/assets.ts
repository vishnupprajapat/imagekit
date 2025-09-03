import type {SanityClient} from 'sanity'

import {getFileDetails} from '../clients/imageKitClient'
import type {ImageKitAsset, VideoAssetDocument} from '../util/types'
import {testSecrets} from './secrets'

export async function deleteAssetOnImageKit(
  client: SanityClient,
  fileId: string
): Promise<{success: boolean; message?: string} | unknown> {
  // First get the ImageKit credentials
  const secrets = await testSecrets(client)
  if (!secrets || !secrets.status) {
    throw new Error('ImageKit credentials not configured')
  }

  // Import the ImageKit client
  const {createImageKitClient} = await import('../clients/imageKitClient')
  const imagekit = createImageKitClient(secrets)

  try {
    // Delete file from ImageKit
    return imagekit.deleteFile(fileId)
  } catch (error: unknown) {
    // If the file doesn't exist (404), consider it already deleted
    const err = error as {response?: {status?: number}; statusCode?: number}
    if (err?.response?.status === 404 || err?.statusCode === 404) {
      // File not found on ImageKit, considering it already deleted
      return {success: true, message: 'File already deleted or not found'}
    }
    // Re-throw other errors
    throw error
  }
}

export async function deleteAsset({
  client,
  asset,
  deleteOnImageKit = true,
}: {
  client: SanityClient
  asset: VideoAssetDocument
  deleteOnImageKit?: boolean
}) {
  if (!asset?._id) return true

  try {
    await client.delete(asset._id)
  } catch (error) {
    return 'failed-sanity'
  }

  if (deleteOnImageKit && asset?.fileId) {
    try {
      await deleteAssetOnImageKit(client, asset.fileId)
    } catch (error) {
      return 'failed-imagekit'
    }
  }

  return true
}

export async function getAsset(client: SanityClient, fileId: string) {
  // Get the ImageKit credentials
  const secrets = await testSecrets(client)
  if (!secrets || !secrets.status) {
    throw new Error('ImageKit credentials not configured')
  }

  // Get file details from ImageKit
  const fileDetails = await getFileDetails(client, secrets, fileId)

  return {data: fileDetails as unknown as ImageKitAsset}
}
