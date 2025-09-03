import type {SanityClient} from 'sanity'

import {createImageKitClient} from '../clients/imageKitClient'
import {cleanImageKitUrl} from './cleanUrl'
import type {AnimatedThumbnailOptions, ConfiguredSecrets} from './types'

/**
 * Get a URL for an animated thumbnail (GIF) from ImageKit
 */
export function getAnimatedPosterSrc(
  client: SanityClient,
  secrets: ConfiguredSecrets,
  fileId: string,
  options: AnimatedThumbnailOptions & {isPrivate?: boolean} = {}
): string {
  const {start, end, width, height, fps, isPrivate = false} = options

  // Create transformation array for ImageKit
  const transformations: Array<Record<string, string | number>> = [
    {
      format: 'gif', // Convert to GIF format
    },
  ]

  // Add size transformations
  if (width || height) {
    const sizeTransform: Record<string, string | number> = {
      // Required to maintain type compatibility with the array
      format: 'gif',
    }

    if (width) sizeTransform.width = width
    if (height) sizeTransform.height = height

    transformations.push(sizeTransform)
  }

  // Add video range transformations
  if (start !== undefined || end !== undefined || fps) {
    const videoTransform: Record<string, string | number> = {
      // Required to maintain type compatibility with the array
      format: 'gif',
    }

    if (start !== undefined) {
      videoTransform.startTime = start
    }

    if (end !== undefined) {
      videoTransform.endTime = end
    }

    if (fps) {
      videoTransform.fps = fps
    }

    transformations.push(videoTransform)
  }

  // Get the ImageKit client
  const imagekit = createImageKitClient(secrets)

  // Generate the URL with transformations
  return cleanImageKitUrl(
    imagekit.url({
      path: `/${fileId}`,
      transformation: transformations,
      signed: isPrivate,
      expireSeconds: isPrivate ? 3600 : undefined, // 1 hour for private files
    })
  )
}
