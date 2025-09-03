import {useCallback} from 'react'
import {PatchEvent, unset} from 'sanity'

import {deleteAssetOnImageKit} from '../actions/assets'
import {useClient} from '../hooks/useClient'
import type {ImageKitInputProps, VideoAssetDocument} from '../util/types'

export const useCancelUpload = (
  asset: VideoAssetDocument,
  onChange: ImageKitInputProps['onChange']
) => {
  const client = useClient()
  return useCallback(() => {
    if (!asset) {
      return
    }
    onChange(PatchEvent.from(unset()))
    if (asset.fileId) {
      deleteAssetOnImageKit(client, asset.fileId)
    }
    if (asset._id) {
      client.delete(asset._id)
    }
  }, [asset, client, onChange])
}
