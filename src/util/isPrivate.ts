import type {VideoAssetDocument} from './types'

/**
 * Check if an ImageKit asset is private (requires authentication)
 */
export function isPrivate(asset?: Partial<VideoAssetDocument> | null): boolean {
  if (!asset || !asset.data) {
    return false
  }

  return asset.data.isPrivateFile === true
}
