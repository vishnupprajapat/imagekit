import {ErrorOutlineIcon} from '@sanity/icons'
import {Button, Card, CardTone, Flex, Text} from '@sanity/ui'
import React, {useRef} from 'react'

import {DialogStateProvider} from '../../context/DialogStateContext'
import {type DialogState, type SetDialogState} from '../../hooks/useDialogState'
import {useUploader} from '../../hooks/useUploader'
import type {ImageKitInputProps, PluginConfig, Secrets, VideoAssetDocument} from '../../util/types'
import InputBrowser from '../InputBrowser'
import Player from '../Player'
import PlayerActionsMenu from '../PlayerActionsMenu'
import UploadConfiguration from '../UploadConfiguration'
import {UploadCard} from './Uploader.styled'
import UploadPlaceholder from './UploadPlaceholder'

interface Props extends Pick<ImageKitInputProps, 'onChange'> {
  config: PluginConfig
  client: any
  secrets: Secrets
  asset: VideoAssetDocument | null | undefined
  dialogState: DialogState
  setDialogState: SetDialogState
  needsSetup: boolean
  readOnly?: boolean
}

export default function Uploader(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    state,
    dragState,
    dispatch,
    handlers: {
      startUpload,
      handleUpload,
      handlePaste,
      handleDrop,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
    },
  } = useUploader(props.client, props.onChange)

  /* -------------------------------- Rendering ------------------------------- */

  if (state.error !== null) {
    const error = state.error
    return (
      <Card padding={3} tone="critical">
        <Flex gap={3} direction="column">
          <Flex justify="center" align="center" gap={2}>
            <Text size={5} muted>
              <ErrorOutlineIcon />
            </Text>
            <Text weight="medium">Upload Failed</Text>
          </Flex>

          {error instanceof Error && error.message && (
            <Text size={1} muted align="center">
              {error.message}
            </Text>
          )}

          <Card padding={3} tone="caution" style={{border: '1px solid #f59e0b'}}>
            <Flex direction="column" gap={2}>
              <Text size={1} weight="medium" style={{color: '#d97706'}}>
                ⚠️ ImageKit Monthly Usage Limit
              </Text>
              <Text size={1} muted>
                Upload failed - this commonly occurs when you&apos;ve reached your{' '}
                <strong>ImageKit free plan&apos;s monthly limits</strong>.
              </Text>
              <Text size={1} muted>
                Free plans have monthly limits for uploads, bandwidth, and storage. Check your{' '}
                <strong>ImageKit dashboard</strong> to view current usage.
              </Text>
              <Text size={1} muted>
                Wait for monthly reset or consider upgrading your plan to continue uploading videos.
              </Text>
            </Flex>
          </Card>

          <Flex justify="center">
            <Button
              text="Clear Error & Select Video"
              onClick={() => dispatch({action: 'reset'})}
              tone="primary"
            />
          </Flex>
        </Flex>
      </Card>
    )
  }

  if (state.stagedUpload !== null) {
    return (
      <UploadConfiguration
        stagedUpload={state.stagedUpload}
        pluginConfig={props.config}
        secrets={props.secrets}
        startUpload={startUpload}
        onClose={() => dispatch({action: 'reset'})}
      />
    )
  }

  let tone: CardTone | undefined
  if (dragState) tone = dragState === 'valid' ? 'positive' : 'critical'

  return (
    <>
      <UploadCard
        tone={tone}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragEnter}
        onPaste={handlePaste}
        ref={containerRef}
      >
        {props.asset ? (
          <DialogStateProvider
            dialogState={props.dialogState}
            setDialogState={props.setDialogState}
          >
            <Player
              readOnly={props.readOnly}
              asset={props.asset}
              onChange={props.onChange}
              buttons={
                <PlayerActionsMenu
                  asset={props.asset}
                  dialogState={props.dialogState}
                  setDialogState={props.setDialogState}
                  onChange={props.onChange}
                  onSelect={handleUpload}
                  readOnly={props.readOnly}
                />
              }
            />
          </DialogStateProvider>
        ) : (
          <UploadPlaceholder
            hovering={dragState !== null}
            onSelect={handleUpload}
            readOnly={!!props.readOnly}
            setDialogState={props.setDialogState}
            needsSetup={props.needsSetup}
            onChange={props.onChange}
          />
        )}
      </UploadCard>
      {props.dialogState === 'select-video' && (
        <InputBrowser
          asset={props.asset}
          onChange={props.onChange}
          setDialogState={props.setDialogState}
        />
      )}
    </>
  )
}
