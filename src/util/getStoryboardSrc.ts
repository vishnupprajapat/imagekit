import type {VideoAssetDocument} from './types'

/**
 * Get a URL for a video storyboard (thumbnails for the timeline) from ImageKit
 *
 * For ImageKit, we need to generate a series of thumbnails at different time points
 * and return a VTT file that the video player can use for the scrubber timeline.
 */
export function getStoryboardSrc({asset}: {asset: VideoAssetDocument}): string {
  if (!asset || !asset.fileId || !asset.data) {
    return ''
  }

  // If there's no duration, we can't generate thumbnails
  const duration = asset.data?.duration || 0
  if (!duration) {
    return ''
  }

  // Generate a data URL with a simple VTT file for thumbnails
  // This is a simplified implementation for ImageKit thumbnails

  // For a proper implementation, you would need to:
  // 1. Generate multiple thumbnails at different timestamps
  // 2. Create a VTT file that references those thumbnails
  // 3. Host that VTT file somewhere accessible

  // For now, we'll create a minimal VTT file that at least won't cause errors
  const vttContent = `WEBVTT

NOTE
This is a simplified thumbnail track for ImageKit videos.
For a complete implementation, you would need to generate thumbnails
at various timestamps and reference them here.

00:00:00.000 --> ${formatTime(duration)}
${asset.url || ''}
`

  // Return as a data URL
  return `data:text/vtt;base64,${btoa(vttContent)}`
}

// Helper function to format time in VTT format (HH:MM:SS.mmm)
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}
