import {Video} from '@imagekit/react'
import {ErrorOutlineIcon, UploadIcon} from '@sanity/icons'
import {Button, Card, Flex, Text} from '@sanity/ui'
import {type PropsWithChildren, useRef, useState} from 'react'

import {useDialogStateContext} from '../context/DialogStateContext'
import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import {AUDIO_ASPECT_RATIO, MIN_ASPECT_RATIO} from '../util/constants'
import type {VideoAssetDocument} from '../util/types'
import EditThumbnailDialog from './EditThumbnailDialog'

/**
 * Helper function to check if an asset is audio
 */
export function assetIsAudio(asset: VideoAssetDocument) {
  return asset?.data?.type === 'audio'
}

export default function VideoPlayer({
  asset,
  children,
  forceAspectRatio,
  autoPlay = false,
  onClearError,
}: PropsWithChildren<{
  asset: VideoAssetDocument
  forceAspectRatio?: number
  autoPlay?: boolean
  onClearError?: () => void
}>) {
  const {dialogState, setDialogState} = useDialogStateContext()
  const {value} = useSecretsDocumentValues()
  const urlEndpoint = value.secrets.urlEndpoint
  const [videoError, setVideoError] = useState<boolean>(false)

  const isAudio = assetIsAudio(asset)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Calculate aspect ratio
  let aspectRatio = forceAspectRatio

  if (!aspectRatio) {
    if (isAudio) {
      aspectRatio = AUDIO_ASPECT_RATIO
    } else if (!asset?.data?.height || !asset?.data?.width) {
      aspectRatio = MIN_ASPECT_RATIO
    } else {
      aspectRatio = Math.max(asset.data.width / asset.data.height, MIN_ASPECT_RATIO)
    }
  }

  if (!asset?.status) {
    return (
      <Card radius={2} padding={3}>
        <Text size={1} muted align="center">
          <ErrorOutlineIcon style={{marginRight: '0.5em'}} />
          Missing video asset data
        </Text>
      </Card>
    )
  }

  if (asset.status === 'errored') {
    return (
      <Card radius={2} padding={3} tone="critical">
        <Flex direction="column" gap={3}>
          <Text size={1} muted align="center">
            <ErrorOutlineIcon style={{marginRight: '0.5em'}} />
            There was an error processing this video asset
          </Text>
          <Card padding={3} tone="caution" style={{border: '1px solid #f59e0b'}}>
            <Flex direction="column" gap={2}>
              <Text size={1} weight="medium" style={{color: '#d97706'}}>
                📊 ImageKit Free Plan Limits
              </Text>
              <Text size={1} muted>
                Video processing failed - this commonly happens when monthly usage limits are
                exceeded on free ImageKit plans.
              </Text>
              <Text size={1} muted>
                Check your <strong>ImageKit dashboard</strong> to verify if you&apos;ve reached your
                monthly processing limits.
              </Text>
            </Flex>
          </Card>
          {onClearError && (
            <Flex justify="center">
              <Button
                icon={UploadIcon}
                text="Clear Error & Select Video"
                onClick={onClearError}
                tone="primary"
              />
            </Flex>
          )}
        </Flex>
      </Card>
    )
  }

  if (!urlEndpoint || !asset.fileId) {
    return (
      <Card radius={2} padding={3}>
        <Text size={1} align="center">
          <ErrorOutlineIcon style={{marginRight: '0.5em'}} />
          Unable to load video: Missing URL endpoint or file ID
        </Text>
      </Card>
    )
  }

  // Check if we should use the full URL from asset data instead of constructing it
  // For ImageKit Video component, we need to use the filePath, not the full URL
  let actualVideoSrc = asset.data?.filePath || `/${asset.fileId}`

  // If filePath starts with a slash, use it as is, otherwise add a slash
  if (actualVideoSrc && !actualVideoSrc.startsWith('/')) {
    actualVideoSrc = `/${actualVideoSrc}`
  }

  if (videoError) {
    return (
      <Card radius={2} padding={3} tone="critical">
        <Flex direction="column" gap={3}>
          <Text size={1} muted align="center">
            <ErrorOutlineIcon style={{marginRight: '0.5em'}} />
            Error playing video. The file might be missing or inaccessible.
          </Text>
          <Card padding={3} tone="caution" style={{border: '1px solid #f59e0b'}}>
            <Flex direction="column" gap={2}>
              <Text size={1} weight="medium" style={{color: '#d97706'}}>
                📊 Monthly Usage Limit
              </Text>
              <Text size={1} muted>
                If you&apos;re using ImageKit&apos;s <strong>free plan</strong>, you may have
                reached your monthly usage limit for video processing and bandwidth.
              </Text>
              <Text size={1} muted>
                • Free plans typically include limited monthly bandwidth and storage
              </Text>
              <Text size={1} muted>
                • Check your <strong>ImageKit dashboard</strong> to view current usage
              </Text>
              <Text size={1} muted>
                • Usage resets monthly or consider upgrading your plan
              </Text>
            </Flex>
          </Card>
          {onClearError && (
            <Flex justify="center">
              <Button
                icon={UploadIcon}
                text="Clear Error & Select Video"
                onClick={onClearError}
                tone="primary"
              />
            </Flex>
          )}
        </Flex>
      </Card>
    )
  }

  // Generate poster image URL using ImageKit's video transformation
  // For now, disable poster to avoid 404 errors until we figure out proper video thumbnails
  const posterSrc = undefined // Temporarily disable poster

  return (
    <>
      <div
        style={{
          maxWidth: '100%',
          aspectRatio: String(aspectRatio),
          position: 'relative',
          backgroundColor: 'black',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            overflow: 'hidden',
          }}
        >
          <Video
            ref={videoRef as React.RefObject<HTMLVideoElement>}
            urlEndpoint={urlEndpoint}
            src={actualVideoSrc}
            poster={posterSrc}
            controls
            autoPlay={autoPlay}
            onError={() => {
              setVideoError(true)
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
            }}
          />
        </div>
        {children}
      </div>

      {dialogState === 'edit-thumbnail' && (
        <EditThumbnailDialog
          asset={asset}
          currentTime={videoRef?.current?.currentTime}
          onClose={() => setDialogState(false)}
        />
      )}
    </>
  )
}
