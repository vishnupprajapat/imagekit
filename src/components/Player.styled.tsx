import {useState} from 'react'
import {styled} from 'styled-components'

import type {VideoAssetDocument} from '../util/types'

export const StyledCenterControls = styled.div`
  && {
    --media-background-color: transparent;
    --media-button-icon-width: 100%;
    --media-button-icon-height: auto;
    pointer-events: none;
    width: 100%;
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: center;
    media-play-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      padding: 0;
      width: max(27px, min(9%, 90px));
    }
  }
`

export const TopControls = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  justify-content: flex-end;
  button {
    height: auto;
  }
`

export interface PosterImageProps {
  asset: VideoAssetDocument
}
export interface ThumbnailsMetadataTrackProps {
  asset: VideoAssetDocument
}
export function ThumbnailsMetadataTrack({asset}: ThumbnailsMetadataTrackProps) {
  // Generate a simple data URL with VTT content for the thumbnails
  const [src] = useState<string>(() => {
    // If there's no asset data, return an empty VTT
    if (!asset || !asset.data) {
      return 'data:text/vtt;base64,V0VCVlRUCgpOT1RFCk5vIHRodW1ibmFpbCBkYXRhIGF2YWlsYWJsZQo='
    }

    // Get duration or use a default
    const duration = asset.data?.duration || 0
    if (!duration) {
      return 'data:text/vtt;base64,V0VCVlRUCgpOT1RFCk5vIGR1cmF0aW9uIGRhdGEgYXZhaWxhYmxlCg=='
    }

    // Format time in VTT format (HH:MM:SS.mmm)
    const formatTime = (seconds: number): string => {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.floor(seconds % 60)
      const ms = Math.floor((seconds % 1) * 1000)

      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
    }

    // Create a simple VTT file
    const vttContent = `WEBVTT

NOTE
This is a simplified thumbnail track for ImageKit videos.

00:00:00.000 --> ${formatTime(duration)}
${asset.url || ''}
`

    // Return as a data URL
    return `data:text/vtt;base64,${btoa(vttContent)}`
  })

  return <track label="thumbnails" default kind="metadata" src={src} />
}
