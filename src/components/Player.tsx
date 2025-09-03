import {Card, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {PatchEvent, unset} from 'sanity'

import {useCancelUpload} from '../hooks/useCancelUpload'
import type {ImageKitInputProps, VideoAssetDocument} from '../util/types'
import {TopControls} from './Player.styled'
import {UploadProgress} from './UploadProgress'
import VideoPlayer from './VideoPlayer'

interface Props extends Pick<ImageKitInputProps, 'onChange'> {
  buttons?: React.ReactNode
  asset: VideoAssetDocument
  readOnly?: boolean
}

const Player = ({asset, buttons, readOnly, onChange}: Props) => {
  // Handler to clear the video field when there's an error
  const handleClearError = useCallback(() => {
    if (onChange) {
      onChange(PatchEvent.from(unset([])))
    }
  }, [onChange])

  const isLoading = useMemo<boolean | string>(() => {
    if (asset?.status === 'preparing') {
      return 'Preparing the video'
    }
    if (asset?.status === 'waiting_for_upload') {
      return 'Waiting for upload to start'
    }
    if (asset?.status === 'waiting') {
      return 'Processing upload'
    }
    if (asset?.status === 'ready') {
      return false
    }
    if (typeof asset?.status === 'undefined') {
      return false
    }

    return true
  }, [asset])
  const isPreparingStaticRenditions = useMemo<boolean>(() => {
    if (asset?.data?.formats?.status === 'processing') {
      return true
    }
    if (asset?.data?.formats?.status === 'ready') {
      return false
    }
    return false
  }, [asset?.data?.formats?.status])
  const playRef = useRef<HTMLDivElement>(null)
  const muteRef = useRef<HTMLDivElement>(null)
  const handleCancelUpload = useCancelUpload(asset, onChange)

  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = 'button svg { vertical-align: middle; }'

    if (playRef.current?.shadowRoot) {
      playRef.current.shadowRoot.appendChild(style)
    }
    if (muteRef?.current?.shadowRoot) {
      muteRef.current.shadowRoot.appendChild(style.cloneNode(true))
    }
  }, [])

  useEffect(() => {
    if (asset?.status === 'errored') {
      handleCancelUpload()
      // eslint-disable-next-line no-warning-comments
      // @TODO use better error handling
      throw new Error('ImageKit processing error')
    }
  }, [asset?.status, handleCancelUpload])

  if (!asset || !asset.status) {
    return null
  }

  if (isLoading) {
    return (
      <UploadProgress
        progress={75}
        text={(isLoading !== true && isLoading) || 'Waiting for ImageKit to process the video'}
      />
    )
  }

  return (
    <VideoPlayer asset={asset} onClearError={readOnly ? undefined : handleClearError}>
      {buttons && <TopControls slot="top-chrome">{buttons}</TopControls>}
      {isPreparingStaticRenditions && (
        <Card
          padding={2}
          radius={1}
          style={{
            background: 'var(--card-fg-color)',
            position: 'absolute',
            top: '0.5em',
            left: '0.5em',
          }}
        >
          <Text size={1} style={{color: 'var(--card-bg-color)'}}>
            ImageKit is preparing optimized versions, please wait
          </Text>
        </Card>
      )}
    </VideoPlayer>
  )
}

export default Player
