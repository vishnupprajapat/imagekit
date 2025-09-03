import {type InputProps, isObjectInputProps, type PreviewLayoutKey, type PreviewProps} from 'sanity'

import type {ImageKitInputPreviewProps, ImageKitInputProps} from './types'

export function isImageKitInputProps(props: InputProps): props is ImageKitInputProps {
  return isObjectInputProps(props) && props.schemaType.type?.name === 'imagekit.video'
}

export function isImageKitInputPreviewProps(
  props: PreviewProps<PreviewLayoutKey>
): props is ImageKitInputPreviewProps {
  return props.schemaType?.type?.name === 'imagekit.video'
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed && !!parsed.protocol.match(/http:|https:/)
  } catch {
    return false
  }
}
