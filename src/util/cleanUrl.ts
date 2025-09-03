/**
 * Remove only the ?updatedAt query parameter from ImageKit URLs
 * This preserves other important parameters like transformations, signed URLs, etc.
 * @param url - The URL to clean
 * @returns The URL without the updatedAt parameter
 */
export function cleanImageKitUrl(url: string): string {
  if (!url) return url

  try {
    const urlObj = new URL(url)
    // Only remove the updatedAt parameter, keep all other parameters
    urlObj.searchParams.delete('updatedAt')
    return urlObj.toString()
  } catch (error) {
    // If URL parsing fails, return original URL
    return url
  }
}

/**
 * Clean URLs in an object recursively
 * @param obj - Object that may contain URLs
 * @returns Object with cleaned URLs
 */
export function cleanUrlsInObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj

  const cleaned = {...obj} as any

  for (const [key, value] of Object.entries(cleaned)) {
    if (key === 'url' && typeof value === 'string') {
      cleaned[key] = cleanImageKitUrl(value)
    } else if (key === 'thumbnailUrl' && typeof value === 'string') {
      cleaned[key] = cleanImageKitUrl(value)
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = cleanUrlsInObject(value)
    }
  }

  return cleaned as T
}
