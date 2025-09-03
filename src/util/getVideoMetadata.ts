import type {SanityClient} from 'sanity'

import {getFileDetails} from '../clients/imageKitClient'
import {formatSeconds} from './formatSeconds'
import type {ConfiguredSecrets} from './types'
import {ImageKitVideoMetadata, VideoAssetDocument} from './types'

// Get metadata from a document
export default function getVideoMetadata(doc: VideoAssetDocument) {
  const id = doc.fileId || doc._id || ''
  const date = doc.data?.created
    ? new Date(doc.data.created)
    : new Date(doc._createdAt || doc._updatedAt || Date.now())

  return {
    title: doc.filename || id.slice(0, 12),
    id: id,
    fileId: doc.fileId,
    createdAt: date,
    duration: doc.data?.duration ? formatSeconds(doc.data?.duration) : undefined,
    width: doc.data?.width,
    height: doc.data?.height,
    size: doc.data?.size ? `${Math.round(doc.data.size / 1024 / 1024)}MB` : undefined,
  }
}

// Get fresh metadata from ImageKit API
export async function getVideoMetadataFromApi(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  fileId: string
): Promise<ImageKitVideoMetadata | null> {
  try {
    // Get the file details from ImageKit
    const fileDetails = await getFileDetails(client, secrets, fileId)

    // Extract video metadata if available
    if (fileDetails && fileDetails.fileType && fileDetails.fileType.startsWith('video')) {
      const videoMetadata: ImageKitVideoMetadata = {
        id: fileDetails.fileId,
        type: fileDetails.fileType || 'video',
        width: fileDetails.width || 0,
        height: fileDetails.height || 0,
        duration: typeof fileDetails.duration === 'number' ? fileDetails.duration : 0,
        size: fileDetails.size,
      }

      return videoMetadata
    }

    return null
  } catch (error) {
    return null
  }
}
