import {CheckmarkIcon, EditIcon, LockIcon, PlayIcon} from '@sanity/icons'
import {Button, Card, Stack, Text, Tooltip} from '@sanity/ui'
import React, {useState} from 'react'
import {styled} from 'styled-components'

import {THUMBNAIL_ASPECT_RATIO} from '../util/constants'
import {getPlaybackPolicy} from '../util/getPlaybackPolicy'
import {VideoAssetDocument} from '../util/types'
import IconInfo from './IconInfo'
import VideoMetadata from './VideoMetadata'
import VideoPlayer, {assetIsAudio} from './VideoPlayer'
import VideoThumbnail from './VideoThumbnail'

const PlayButton = styled.button`
  display: block;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0.1875rem;
  position: relative;
  cursor: pointer;

  &::after {
    content: '';
    background: var(--card-fg-color);
    opacity: 0;
    display: block;
    position: absolute;
    inset: 0;
    z-index: 10;
    transition: 0.15s ease-out;
    border-radius: inherit;
  }

  > div[data-play] {
    z-index: 11;
    opacity: 0;
    transition: 0.15s 0.05s ease-out;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: var(--card-fg-color);
    background: var(--card-bg-color);
    width: auto;
    height: 30%;
    aspect-ratio: 1;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    > svg {
      display: block;
      width: 70%;
      height: auto;
      // Visual balance to center-align the icon
      transform: translateX(5%);
    }
  }

  &:hover,
  &:focus {
    &::after {
      opacity: 0.3;
    }
    > div[data-play] {
      opacity: 1;
    }
  }
`

export default function VideoInBrowser({
  onSelect,
  onEdit,
  asset,
}: {
  onSelect?: (asset: VideoAssetDocument) => void
  onEdit?: (asset: VideoAssetDocument) => void
  asset: VideoAssetDocument
}) {
  const [renderVideo, setRenderVideo] = useState(false)
  const select = React.useCallback(() => onSelect?.(asset), [onSelect, asset])
  const edit = React.useCallback(() => onEdit?.(asset), [onEdit, asset])

  if (!asset) {
    return null
  }

  const playbackPolicy = getPlaybackPolicy()

  return (
    <Card
      border
      padding={2}
      sizing="border"
      radius={2}
      style={{
        position: 'relative',
      }}
    >
      {playbackPolicy === 'signed' && (
        <Tooltip
          animate
          content={
            <Card padding={2} radius={2}>
              <IconInfo icon={LockIcon} text="Signed playback policy" size={2} />
            </Card>
          }
          placement="right"
          fallbackPlacements={['top', 'bottom']}
          portal
        >
          <Card
            tone="caution"
            style={{
              borderRadius: '100%',
              position: 'absolute',
              left: '1em',
              top: '1em',
              zIndex: 10,
            }}
            padding={2}
            border
          >
            <Text muted size={1}>
              <LockIcon />
            </Text>
          </Card>
        </Tooltip>
      )}
      <Stack
        space={3}
        height="fill"
        style={{
          gridTemplateRows: 'min-content min-content 1fr',
        }}
      >
        {renderVideo ? (
          <VideoPlayer asset={asset} autoPlay forceAspectRatio={THUMBNAIL_ASPECT_RATIO} />
        ) : (
          <PlayButton onClick={() => setRenderVideo(true)}>
            <div data-play>
              <PlayIcon />
            </div>
            {assetIsAudio(asset) ? (
              <div
                style={{
                  aspectRatio: THUMBNAIL_ASPECT_RATIO,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width={128}
                  height={128}
                  xmlSpace="preserve"
                  viewBox="0 0 128 128"
                >
                  <image
                    width={128}
                    height={128}
                    xlinkHref="data:image/jpeg;base64,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"
                  />
                </svg>
              </div>
            ) : (
              <VideoThumbnail asset={asset} />
            )}
          </PlayButton>
        )}
        <VideoMetadata asset={asset} />
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: '.35rem',
          }}
        >
          {onSelect && (
            <Button
              icon={CheckmarkIcon}
              fontSize={2}
              padding={2}
              mode="ghost"
              text="Select"
              style={{flex: 1}}
              tone="positive"
              onClick={select}
            />
          )}
          <Button
            icon={EditIcon}
            fontSize={2}
            padding={2}
            mode="ghost"
            text="Details"
            style={{flex: 1}}
            onClick={edit}
          />
        </div>
      </Stack>
    </Card>
  )
}
