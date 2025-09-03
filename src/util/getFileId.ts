import type {VideoAssetDocument} from './types'

/**
 * Get the file ID for an ImageKit asset
 */
export function getFileId(asset?: Partial<VideoAssetDocument> | null): string {
  if (!asset) {
    return ''
  }

  return asset.fileId || ''
}
