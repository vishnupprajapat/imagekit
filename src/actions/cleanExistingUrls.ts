import type {SanityClient} from 'sanity'

import {cleanImageKitUrl} from '../util/cleanUrl'

/**
 * Clean existing video asset URLs by removing the updatedAt parameter
 * This is a utility function to fix assets that were created before the URL cleaning was implemented
 */
export async function cleanExistingVideoAssetUrls(client: SanityClient): Promise<{
  total: number
  cleaned: number
  errors: string[]
}> {
  const errors: string[] = []
  let cleaned = 0

  try {
    // Fetch all imagekit video assets
    const assets = await client.fetch(
      `*[_type == "imagekit.videoAsset" && url match "*?updatedAt*"]`
    )

    const total = assets.length

    if (total === 0) {
      return {total: 0, cleaned: 0, errors: []}
    }

    // Process assets in batches to avoid overwhelming the API
    const batchSize = 10
    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(async (asset: any) => {
          try {
            const patches = []

            // Clean the main URL
            if (asset.url?.includes('?updatedAt')) {
              patches.push({
                patch: {
                  id: asset._id,
                  set: {url: cleanImageKitUrl(asset.url)},
                },
              })
            }

            // Clean URLs in the data object
            if (asset.data?.url?.includes('?updatedAt')) {
              patches.push({
                patch: {
                  id: asset._id,
                  set: {'data.url': cleanImageKitUrl(asset.data.url)},
                },
              })
            }

            // Clean thumbnail URLs if present
            if (asset.data?.thumbnailUrl?.includes('?updatedAt')) {
              patches.push({
                patch: {
                  id: asset._id,
                  set: {'data.thumbnailUrl': cleanImageKitUrl(asset.data.thumbnailUrl)},
                },
              })
            }

            // Apply patches
            for (const {patch} of patches) {
              await client.patch(patch.id).set(patch.set).commit()
            }

            return patches.length > 0 ? 1 : 0
          } catch (error) {
            errors.push(
              `Failed to clean asset ${asset._id}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            )
            return 0
          }
        })
      )

      cleaned += results.reduce((a, b) => a + b, 0)
    }

    return {total, cleaned, errors}
  } catch (error) {
    errors.push(
      `Failed to fetch assets: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return {total: 0, cleaned: 0, errors}
  }
}
