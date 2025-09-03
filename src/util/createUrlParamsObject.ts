import type {SanityClient} from 'sanity'

import type {AssetThumbnailOptions, ConfiguredSecrets} from './types'

/**
 * Create URL parameters for ImageKit URLs
 */
export function createUrlParamsObject(
  client: SanityClient,
  asset: AssetThumbnailOptions['asset'],
  params: Record<string, string | number | boolean> = {},
  secrets?: ConfiguredSecrets
) {
  const fileId = asset.fileId || ''

  const searchParams = new URLSearchParams(
    JSON.parse(JSON.stringify(params, (_, v) => v ?? undefined))
  )

  // Add authentication parameters if needed and secrets are provided
  if (secrets?.enablePrivateImages && asset.url) {
    // Add authentication parameters based on ImageKit's requirements
    // This will depend on their authentication mechanism
  }

  return {fileId, searchParams}
}
