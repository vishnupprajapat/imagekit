export const imageKitVideoSchema = {
  name: 'imagekit.video',
  type: 'object',
  title: 'Video asset reference',
  fields: [
    {
      title: 'Video',
      name: 'asset',
      type: 'reference',
      weak: true,
      to: [{type: 'imagekit.videoAsset'}],
    },
  ],
}

// const imageKitVideoMetadata = {
//   name: 'imagekit.videoMetadata',
//   type: 'object',
//   fields: [
//     {type: 'string', name: 'id'},
//     {type: 'string', name: 'type'},
//     {type: 'number', name: 'width'},
//     {type: 'number', name: 'height'},
//     {type: 'number', name: 'duration'},
//     {type: 'number', name: 'size'},
//   ],
// }

const imageKitTransformation = {
  name: 'imagekit.transformation',
  type: 'object',
  fields: [
    {type: 'string', name: 'name'},
    {type: 'string', name: 'params'},
  ],
}

const imageKitVideoFormat = {
  name: 'imagekit.videoFormat',
  type: 'object',
  fields: [
    {type: 'string', name: 'format'},
    {type: 'string', name: 'url'},
    {type: 'number', name: 'width'},
    {type: 'number', name: 'bitrate'},
    {type: 'number', name: 'filesize'},
    {type: 'number', name: 'height'},
  ],
}

const imageKitVideoFormats = {
  name: 'imagekit.videoFormats',
  type: 'object',
  fields: [
    {
      name: 'formats',
      type: 'array',
      of: [{type: 'imagekit.videoFormat'}],
    },
  ],
}

const imageKitAssetData = {
  name: 'imagekit.assetData',
  title: 'ImageKit asset data',
  type: 'object',
  fields: [
    {
      type: 'string',
      name: 'resolution',
    },
    {
      type: 'string',
      name: 'upload_id',
    },
    {
      type: 'string',
      name: 'created_at',
    },
    {
      type: 'string',
      name: 'max_resolution',
    },
    {
      type: 'string',
      name: 'transformation',
    },
    // {
    //   type: 'string',
    //   name: 'privacy',
    // },
    {
      type: 'string',
      name: 'aspect_ratio',
    },
    {
      type: 'number',
      name: 'duration',
    },
    {
      type: 'number',
      name: 'frame_rate',
    },
    {
      type: 'string',
      name: 'quality',
    },
    // Additional fields from ImageKit upload response
    {
      type: 'array',
      name: 'AITags',
      of: [{type: 'string'}],
    },
    {
      type: 'string',
      name: 'audioCodec',
    },
    {
      type: 'number',
      name: 'bitRate',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'string',
      name: 'fileId',
    },
    {
      type: 'string',
      name: 'filePath',
    },
    {
      type: 'string',
      name: 'fileType',
    },
    {
      type: 'number',
      name: 'height',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'number',
      name: 'size',
    },
    {
      type: 'string',
      name: 'url',
    },
    {
      type: 'object',
      name: 'versionInfo',
      fields: [
        {
          type: 'string',
          name: 'id',
        },
        {
          type: 'string',
          name: 'name',
        },
      ],
    },
    {
      type: 'string',
      name: 'videoCodec',
    },
    {
      type: 'number',
      name: 'width',
    },
    // {
    //   name: 'metadata',
    //   type: 'array',
    //   of: [{type: 'imagekit.videoMetadata'}],
    // },
    {
      name: 'transformations',
      type: 'array',
      of: [{type: 'imagekit.transformation'}],
    },
    {
      name: 'video_formats',
      type: 'imagekit.videoFormats',
    },
  ],
}

const imageKitVideoAsset = {
  name: 'imagekit.videoAsset',
  type: 'document',
  title: 'Video asset',
  fields: [
    {
      type: 'string',
      name: 'fileId',
    },
    {
      type: 'string',
      name: 'status',
    },
    {
      type: 'string',
      name: 'url',
    },
    {
      type: 'string',
      name: 'filename',
    },
    {
      type: 'number',
      name: 'thumbTime',
    },
    {
      type: 'imagekit.assetData',
      name: 'data',
    },
  ],
}

export const schemaTypes = [
  // imageKitVideoMetadata,
  imageKitTransformation,
  imageKitVideoFormat,
  imageKitVideoFormats,
  imageKitAssetData,
  imageKitVideoAsset,
]
