/**
 * Debug helper to validate custom metadata before sending to ImageKit
 */
export function validateCustomMetadata(metadata: Record<string, unknown>): {
  valid: boolean
  errors: string[]
  normalized: Record<string, string>
} {
  const errors: string[] = []
  const normalized: Record<string, string> = {}

  for (const [key, value] of Object.entries(metadata)) {
    // Check key format
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      errors.push(
        `Invalid key format: "${key}". Use only alphanumeric, underscore, and dash characters.`
      )
      continue
    }

    // Check value type
    if (value === null || value === undefined) {
      continue // Skip null/undefined values
    }

    if (typeof value === 'object') {
      errors.push(`Invalid value type for key "${key}": objects and arrays are not supported.`)
      continue
    }

    // Normalize to string
    const stringValue = String(value)

    // Check value length (ImageKit has limits)
    if (stringValue.length > 500) {
      errors.push(
        `Value for key "${key}" is too long (${stringValue.length} chars). Maximum is 500 characters.`
      )
      continue
    }

    normalized[key] = stringValue
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized,
  }
}

/**
 * Example of valid metadata structure for ImageKit
 */
export const exampleValidMetadata = {
  hasSubtitles: 'true', // boolean as string
  language: 'en', // string
  duration: '120', // number as string
  category: 'educational', // string
  rating: '4.5', // number as string
  isPublic: 'false', // boolean as string
  uploadedBy: 'user123', // string
  transcoded: 'true', // boolean as string
}

/**
 * Examples of INVALID metadata that will cause errors
 */
export const exampleInvalidMetadata = {
  // These will be filtered out by buildCustomMetadata:
  nested: {object: true}, // ❌ Objects not supported
  tags: ['tag1', 'tag2'], // ❌ Arrays not supported
  nullValue: null, // ❌ Will be skipped
  undefinedValue: undefined, // ❌ Will be skipped

  // These might cause API errors:
  'invalid-key!': 'value', // ❌ Special characters in key
  'key with spaces': 'value', // ❌ Spaces in key
}
