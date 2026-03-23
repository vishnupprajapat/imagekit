import {useToast} from '@sanity/ui'
import debounce from 'lodash.debounce'
import React, {useEffect, useReducer, useRef, useState} from 'react'
import {type Observable, Subject, Subscription} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'
import {PatchEvent, type SanityClient, set, setIfMissing} from 'sanity'

import {uploadFile, uploadUrl} from '../services/imagekit.service'
import {isValidUrl} from '../util/asserters'
import {extractDroppedFiles} from '../util/extractFiles'
import type {ImageKitNewAssetSettings} from '../util/types'

export interface UploadEvent {
  type: 'uuid' | 'file' | 'url' | 'progress' | 'success' | 'pause' | 'resume'
  percent?: number
  asset?: {_id: string}
}

export type StagedUpload = {type: 'file'; files: FileList | File[]} | {type: 'url'; url: string}

export type UploadStatus = {
  progress: number
  file?: {name: string | undefined; type: string}
  uuid?: string
  url?: string
}

export interface UploaderState {
  stagedUpload: StagedUpload | null
  uploadStatus: UploadStatus | null
  error: Error | null
}

const INITIAL_STATE: UploaderState = {
  stagedUpload: null,
  uploadStatus: null,
  error: null,
}

type UploadFileEvent = ReturnType<typeof uploadFile> extends Observable<infer T> ? T : UploadEvent
type UploadUrlEvent = ReturnType<typeof uploadUrl> extends Observable<infer T> ? T : UploadEvent

type UploaderStateAction =
  | {action: 'stageUpload'; input: NonNullable<UploaderState['stagedUpload']>}
  | {action: 'commitUpload'}
  | {action: 'fileInfo'; file?: {name: string; type: string}; uuid?: string}
  | {action: 'urlInfo'; url: string}
  | {action: 'progress'; percent: number}
  | {action: 'error'; error: Error}
  | {action: 'complete' | 'reset'}

export function useUploader(client: SanityClient, onChange: any) {
  const toast = useToast()
  const dragEnteredEls = useRef<EventTarget[]>([])
  const [dragState, setDragState] = useState<'valid' | 'invalid' | null>(null)

  const cancelUploadButton = useRef(
    (() => {
      const events$ = new Subject()
      return {
        observable: events$.asObservable(),
        handleClick: ((event: any) =>
          events$.next(event)) as React.MouseEventHandler<HTMLButtonElement>,
      }
    })()
  ).current

  const uploadRef = useRef<Subscription | null>(null)
  const [state, dispatch] = useReducer((prev: UploaderState, action: UploaderStateAction) => {
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
        uploadRef.current?.unsubscribe()
        uploadRef.current = null
        return INITIAL_STATE
      case 'error':
        uploadRef.current?.unsubscribe()
        uploadRef.current = null
        return Object.assign({}, INITIAL_STATE, {error: action.error})
      default:
        return prev
    }
  }, INITIAL_STATE)

  useEffect(() => {
    return () => {
      if (uploadRef.current && !uploadRef.current.closed) {
        uploadRef.current.unsubscribe()
      }
    }
  }, [])

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
          client,
          url: stagedUpload.url,
          settings,
        })
        break
      case 'file':
        uploadObservable = uploadFile({
          client,
          file: stagedUpload.files[0],
          settings,
        }).pipe(
          takeUntil(
            cancelUploadButton.observable.pipe(
              tap(() => {
                if (state.uploadStatus?.uuid) {
                  client.delete(state.uploadStatus.uuid)
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
              onChange(
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

  const handleUpload = (files: FileList | File[]) => {
    dispatch({action: 'stageUpload', input: {type: 'file', files}})
  }

  const doStageUrlUpload = useRef(
    debounce((url: string) => {
      dispatch({action: 'stageUpload', input: {type: 'url', url}})
    }, 300)
  ).current

  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const clipboardData =
      event.clipboardData || (window as Window & {clipboardData?: DataTransfer}).clipboardData
    const url = clipboardData.getData('text')
    if (!isValidUrl(url)) {
      toast.push({status: 'error', title: 'Invalid URL for ImageKit video input.'})
      return
    }
    doStageUrlUpload(url)
  }

  const doStageFilesUpload = useRef(
    debounce((files: File[]) => {
      dispatch({action: 'stageUpload', input: {type: 'file', files}})
    }, 300)
  ).current

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    setDragState(null)
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer!).then((files) => {
      const validFiles = files.filter((file): file is File => file !== null)
      doStageFilesUpload(validFiles)
    })
  }

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

  return {
    state,
    dragState,
    dispatch,
    cancelUploadButton,
    handlers: {
      startUpload,
      handleUpload,
      handlePaste,
      handleDrop,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
    },
  }
}
