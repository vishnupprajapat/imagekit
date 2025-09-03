import {ErrorOutlineIcon} from '@sanity/icons'
import {Button, Card, CardTone, Flex, Text, useToast} from '@sanity/ui'
import React, {useEffect, useReducer, useRef, useState} from 'react'
import {type Observable, Subject, Subscription} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import {PatchEvent, set, setIfMissing} from 'sanity'

// Import from actions folder
import {uploadFile, uploadUrl} from '../actions/upload-fix'
import {DialogStateProvider} from '../context/DialogStateContext'
import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {isValidUrl} from '../util/asserters'
import {extractDroppedFiles} from '../util/extractFiles'
import type {
  ImageKitInputProps,
  ImageKitNewAssetSettings,
  PluginConfig,
  Secrets,
  VideoAssetDocument,
} from '../util/types'

// Define upload event interface
interface UploadEvent {
  type: 'uuid' | 'file' | 'url' | 'progress' | 'success' | 'pause' | 'resume'
  percent?: number
  asset?: {_id: string}
}

import InputBrowser from './InputBrowser'
import Player from './Player'
import PlayerActionsMenu from './PlayerActionsMenu'
import UploadConfiguration from './UploadConfiguration'
import {UploadCard} from './Uploader.styled'
import UploadPlaceholder from './UploadPlaceholder'
import {UploadProgress} from './UploadProgress'

interface Props extends Pick<ImageKitInputProps, 'onChange'> {
  config: PluginConfig
  client: SanityClient
  secrets: Secrets
  asset: VideoAssetDocument | null | undefined
  dialogState: DialogState
  setDialogState: SetDialogState
  needsSetup: boolean
  readOnly?: boolean
}

export type StagedUpload = {type: 'file'; files: FileList | File[]} | {type: 'url'; url: string}
type UploadStatus = {
  progress: number
  file?: {name: string | undefined; type: string}
  uuid?: string
  url?: string
}

interface State {
  stagedUpload: StagedUpload | null
  uploadStatus: UploadStatus | null
  error: Error | null
}

const INITIAL_STATE: State = {
  stagedUpload: null,
  uploadStatus: null,
  error: null,
}

// Define specific event types based on the uploadFile and uploadUrl return types
type UploadFileEvent = ReturnType<typeof uploadFile> extends Observable<infer T> ? T : UploadEvent
type UploadUrlEvent = ReturnType<typeof uploadUrl> extends Observable<infer T> ? T : UploadEvent

type UploaderStateAction =
  | {action: 'stageUpload'; input: NonNullable<State['stagedUpload']>}
  | {action: 'commitUpload'}
  | {action: 'fileInfo'; file?: {name: string; type: string}; uuid?: string}
  | {action: 'urlInfo'; url: string}
  | {action: 'progress'; percent: number}
  | {action: 'error'; error: Error}
  | {action: 'complete' | 'reset'}

/**
 * The main interface for inputting an ImageKit Video. It handles staging an upload
 * file, setting its configuration, displaying upload progress, and showing
 * the preview player.
 */
export default function Uploader(props: Props) {
  const toast = useToast()
  const containerRef = useRef<HTMLDivElement>(null)

  const dragEnteredEls = useRef<EventTarget[]>([])
  const [dragState, setDragState] = useState<'valid' | 'invalid' | null>(null)

  const cancelUploadButton = useRef(
    (() => {
      const events$ = new Subject()
      return {
        observable: events$.asObservable(),
        handleClick: ((event) => events$.next(event)) as React.MouseEventHandler<HTMLButtonElement>,
      }
    })()
  ).current

  const uploadRef = useRef<Subscription | null>(null)
  const [state, dispatch] = useReducer(
    (prev: State, action: UploaderStateAction) => {
      switch (action.action) {
        case 'stageUpload':
          return Object.assign({}, INITIAL_STATE, {stagedUpload: action.input})
        case 'commitUpload':
          return Object.assign({}, prev, {uploadStatus: {progress: 0}})
        case 'fileInfo':
          return Object.assign({}, prev, {
            uploadStatus: {
              ...prev.uploadStatus,
              progress: prev.uploadStatus?.progress || 0,
              file: action.file,
              uuid: action.uuid,
            },
          })
        case 'urlInfo':
          return Object.assign({}, prev, {
            uploadStatus: {
              ...prev.uploadStatus,
              progress: prev.uploadStatus?.progress || 0,
              url: action.url,
            },
          })
        case 'progress':
          return Object.assign({}, prev, {
            uploadStatus: {
              ...prev.uploadStatus,
              progress: action.percent,
            },
          })
        case 'reset':
        case 'complete':
          // Clear upload observable on completion
          uploadRef.current?.unsubscribe()
          uploadRef.current = null
          return INITIAL_STATE
        case 'error':
          // Clear upload observable on error
          uploadRef.current?.unsubscribe()
          uploadRef.current = null
          return Object.assign({}, INITIAL_STATE, {error: action.error})
        default:
          return prev
      }
    },
    {
      stagedUpload: null,
      uploadStatus: null,
      error: null,
    }
  )

  // Make sure we close out the upload observer on dismount
  useEffect(() => {
    return () => {
      if (uploadRef.current && !uploadRef.current.closed) {
        uploadRef.current.unsubscribe()
      }
    }
  }, [])

  /* -------------------------------------------------------------------------- */
  /*                                  Uploading                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Begins a file or URL upload with the staged files or URL.
   *
   * Should only be called from the UploadConfiguration component, which provides
   * the ImageKit configuration for the direct asset upload.
   *
   * @param settings The ImageKit settings object to send to Sanity
   * @returns
   */
  const startUpload = (settings: ImageKitNewAssetSettings) => {
    const {stagedUpload} = state

    if (!stagedUpload || uploadRef.current) {
      return
    }

    dispatch({action: 'commitUpload'})
    let uploadObservable: Observable<UploadFileEvent | UploadUrlEvent>
    // eslint-disable-next-line default-case
    switch (stagedUpload.type) {
      case 'url':
        uploadObservable = uploadUrl({
          client: props.client,
          url: stagedUpload.url,
          settings: settings,
        })
        break
      case 'file':
        uploadObservable = uploadFile({
          client: props.client,
          file: stagedUpload.files[0],
          settings: settings,
        }).pipe(
          takeUntil(
            cancelUploadButton.observable.pipe(
              tap(() => {
                if (state.uploadStatus?.uuid) {
                  props.client.delete(state.uploadStatus.uuid)
                }
              })
            )
          )
        )
        break
    }
    uploadRef.current = uploadObservable.subscribe({
      next: (event) => {
        switch (event.type) {
          case 'uuid':
          case 'file':
            if ('file' in event) {
              dispatch({action: 'fileInfo', file: event.file, uuid: event.uuid})
            }
            break
          case 'url':
            if ('url' in event) {
              dispatch({action: 'urlInfo', url: event.url})
            }
            break
          case 'progress':
            if (event.percent !== undefined) {
              dispatch({action: 'progress', percent: event.percent})
            }
            break
          case 'success':
            dispatch({action: 'progress', percent: 100})
            if (event.asset && event.asset._id) {
              props.onChange(
                PatchEvent.from([
                  setIfMissing({asset: {}}),
                  set({_type: 'reference', _weak: true, _ref: event.asset._id}, ['asset']),
                ])
              )
            }
            break
          case 'pause':
          case 'resume':
          default:
            break
        }
      },
      complete: () => {
        dispatch({action: 'complete'})
      },
      error: (error) => {
        dispatch({action: 'error', error})
      },
    })
  }

  /* -------------------------- Upload Initialization ------------------------- */
  // The below populate the uploadInput state field, which then triggers the
  // upload configuration, or the startUpload function if no config is required.

  // Stages an upload from the file selector
  const handleUpload = (files: FileList | File[]) => {
    dispatch({
      action: 'stageUpload',
      input: {type: 'file', files},
    })
  }

  // Stages and validates an upload from pasting an asset URL
  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const clipboardData =
      event.clipboardData || (window as Window & {clipboardData?: DataTransfer}).clipboardData
    const url = clipboardData.getData('text')
    if (!isValidUrl(url)) {
      toast.push({status: 'error', title: 'Invalid URL for ImageKit video input.'})
      return
    }
    dispatch({action: 'stageUpload', input: {type: 'url', url: url}})
  }

  // Stages and validates an upload from dragging+dropping files or folders
  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    setDragState(null)
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer!).then((files) => {
      // Filter out any null files
      const validFiles = files.filter((file): file is File => file !== null)
      dispatch({
        action: 'stageUpload',
        input: {type: 'file', files: validFiles},
      })
    })
  }

  /* ------------------------------- Drag State ------------------------------- */

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    dragEnteredEls.current.push(event.target)
    const type = event.dataTransfer.items?.[0]?.type
    setDragState(type?.startsWith('video/') ? 'valid' : 'invalid')
  }

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    const idx = dragEnteredEls.current.indexOf(event.target)
    if (idx > -1) {
      dragEnteredEls.current.splice(idx, 1)
    }
    if (dragEnteredEls.current.length === 0) {
      setDragState(null)
    }
  }

  /* -------------------------------- Rendering ------------------------------- */

  // Upload has errored
  if (state.error !== null) {
    const error = {state}
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
                � ImageKit Monthly Usage Limit
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

  // Upload is in progress
  if (state.uploadStatus !== null) {
    const {uploadStatus} = state
    return (
      <UploadProgress
        onCancel={cancelUploadButton.handleClick}
        progress={uploadStatus.progress}
        filename={uploadStatus.file?.name || uploadStatus.url}
      />
    )
  }

  // Upload needs configuration
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

  // Default: No staged upload
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
