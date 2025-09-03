import type {SanityClient} from 'sanity'

import {createImageKitClient} from '../clients/imageKitClient'
import {cleanImageKitUrl} from './cleanUrl'
import type {ConfiguredSecrets, VideoAssetDocument} from './types'

/**
 * Get the URL for a video from ImageKit
 */
export function getVideoSrc({asset}: {asset: VideoAssetDocument; client: SanityClient}): string {
  if (!asset || !asset.url) {
    return ''
  }

  // Return the cleaned URL from the asset
  return cleanImageKitUrl(asset.url)
}

// The original function with more parameters is kept for reference
export function getVideoSrcWithOptions(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  fileId: string,
  options: {
    isPrivate?: boolean
    quality?: number
    transformation?: string
    max_resolution?: '2160p' | '1440p' | '1080p' | '720p' | '480p'
  } = {}
): string {
  const {isPrivate = false, quality, max_resolution} = options

  // Create transformation array for ImageKit
  const transformations: Array<Record<string, number | string>> = []

  // Add quality transformation if specified
  if (quality !== undefined) {
    transformations.push({
      quality,
    })
  }

  // Add resolution transformation if specified
  if (max_resolution) {
    // Map resolution string to actual height value
    const resolutionMap: Record<string, number> = {
      '2160p': 2160,
      '1440p': 1440,
      '1080p': 1080,
      '720p': 720,
      '480p': 480,
    }

    const height = resolutionMap[max_resolution]
    if (height) {
      transformations.push({
        height,
      })
    }
  }

  // Get the ImageKit client
  const imagekit = createImageKitClient(secrets)

  // Generate the URL with transformations
  return cleanImageKitUrl(
    imagekit.url({
      path: `/${fileId}`,
      transformation: transformations.length > 0 ? transformations : undefined,
      signed: isPrivate,
      expireSeconds: isPrivate ? 3600 : undefined, // 1 hour for private files
    })
  )
}
