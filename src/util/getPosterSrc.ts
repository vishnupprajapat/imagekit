import type {SanityClient} from 'sanity'

import {createImageKitClient} from '../clients/imageKitClient'
import type {ConfiguredSecrets, ThumbnailOptions, VideoAssetDocument} from './types'

/**
 * Get a URL for a thumbnail image from ImageKit based on a VideoAssetDocument
 */
export function getPosterSrc({asset}: {asset: VideoAssetDocument}): string {
  if (!asset || !asset.data || !asset.data.thumbnailUrl) {
    return ''
  }

  // For now, simply return the thumbnail URL from the asset data
  return asset.data.thumbnailUrl
}

/**
 * Get a URL for a thumbnail image from ImageKit
 */
export function getPosterSrcWithOptions(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  fileId: string,
  options: ThumbnailOptions & {isPrivate?: boolean} = {}
): string {
  const {fit, height, width, time, isPrivate = false} = options

  // Create transformation array for ImageKit
  const transformations: Array<Record<string, string | number>> = []

  // Add basic video frame extraction if time is specified
  if (time !== undefined) {
    transformations.push({
      named: 'extract-frame',
      time: `${time}s`,
    })
  }

  // Add size transformations
  if (width || height) {
    const sizeTransform: Record<string, string | number> = {}

    if (width) sizeTransform.width = width
    if (height) sizeTransform.height = height
    if (fit) sizeTransform.focus = fit

    transformations.push(sizeTransform)
  }

  // Get the ImageKit client
  const imagekit = createImageKitClient(secrets)

  // Generate the URL with transformations
  return imagekit.url({
    path: `/${fileId}`,
    transformation: transformations.length > 0 ? transformations : undefined,
    signed: isPrivate,
    expireSeconds: isPrivate ? 3600 : undefined, // 1 hour for private files
  })
}
