import {definePlugin} from 'sanity'

import createStudioTool, {DEFAULT_TOOL_CONFIG} from '../components/StudioTool'
import {imageKitVideoCustomRendering} from '../plugin'
import {imageKitVideoSchema, schemaTypes} from '../schema'
import type {PluginConfig} from '../util/types'
export type {VideoAssetDocument} from '../util/types'

export const defaultConfig: PluginConfig = {
  quality: 80,
  transformation: 'auto',
  max_resolution: '1080p',
  defaultPrivate: false,
  tool: DEFAULT_TOOL_CONFIG,
}

// Export the main plugin that's used in the Sanity config
export const imageKitPlugin = definePlugin<Partial<PluginConfig> | void>((userConfig) => {
  const config: PluginConfig = {...defaultConfig, ...(userConfig || {})}
  return {
    name: 'imagekit-plugin',
    schema: {
      types: [
        ...schemaTypes,
        {
          ...imageKitVideoSchema,
          components: imageKitVideoCustomRendering(config).components,
          preview: imageKitVideoCustomRendering(config).preview,
        },
      ],
    },
    tools: config.tool === false ? undefined : [createStudioTool(config)],
  }
})
