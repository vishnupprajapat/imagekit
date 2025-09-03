import Input from './components/Input'
import VideoThumbnail from './components/VideoThumbnail'
import type {ImageKitInputProps, PluginConfig, VideoAssetDocument} from './util/types'

export function imageKitVideoCustomRendering(config: PluginConfig) {
  return {
    components: {
      input: (props: ImageKitInputProps) => (
        <Input config={{...config, ...props.schemaType.options}} {...props} />
      ),
    },
    preview: {
      select: {
        filename: 'asset.filename',
        fileId: 'asset.fileId',
        status: 'asset.status',
        url: 'asset.url',
        thumbTime: 'asset.thumbTime',
        data: 'asset.data',
      },
      prepare: (asset: Partial<VideoAssetDocument>) => {
        const {filename, fileId, status} = asset
        return {
          title: filename || fileId || '',
          subtitle: status ? `status: ${status}` : null,
          media: asset.fileId ? <VideoThumbnail asset={asset} width={64} /> : null,
        }
      },
    },
  }
}
