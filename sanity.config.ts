import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {imageKitPlugin} from './src/_exports'

export default defineConfig({
  name: 'sanity-plugin-imagekit-plugin',
  projectId: 'cr3krp4q',
  dataset: 'production',
  schema: {
    types: [
      {
        title: 'Trailer',
        name: 'trailer',
        type: 'document',
        fields: [
          {title: 'Title', name: 'title', type: 'string'},
          {
            title: 'Video',
            name: 'video',
            type: 'imagekit.video',
          },
        ],
      },
    ],
  },
  plugins: [
    structureTool(),
    imageKitPlugin({
      quality: 90,
      max_resolution: '1080p',
      transformation: 'auto',
      defaultPrivate: false,
    }),
    visionTool(),
  ],
})
