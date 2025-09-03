/**
 * Normalize custom metadata for ImageKit uploads.
 * ImageKit expects a flat JSON object (string values) serialized as a JSON string.
 * Keys must match custom metadata fields configured in the ImageKit dashboard OR
 * be acceptable dynamic keys (if your plan allows). Nested objects/arrays are not supported.
 */
export function buildCustomMetadata(input?: Record<string, unknown> | null): string | undefined {
  if (!input) return undefined
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue
    // Skip objects/arrays to avoid ImageKit "Invalid custom metadata" errors
    if (typeof value === 'object') continue
    out[key] = String(value)
  }
  if (!Object.keys(out).length) return undefined
  try {
    return JSON.stringify(out)
  } catch (err) {
    // Fallback: ignore metadata if serialization fails
    return undefined
  }
}

/**
 * Convenience parser to safely read customMetadata returned by ImageKit SDK (which may already be object).
 */
export function parseReturnedCustomMetadata(meta: unknown): Record<string, string> | undefined {
  if (!meta) return undefined
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta)
    } catch {
      return undefined
    }
  }
  if (typeof meta === 'object') return meta as Record<string, string>
  return undefined
}
