import {z} from 'zod'

const SubtitleSchema = z.object({
  name: z.string(),
  passthrough: z.string().max(255).optional(),
  language_code: z.string(),
})

const ExtensionSchema = z.object({
  name: z.string(),
  options: z.record(z.unknown()),
})

export const ImageKitSettingsSchema = z.object({
  quality: z.number().min(0).max(100).optional(),
  transformation: z.string().optional(),
  max_resolution: z.enum(['2160p', '1440p', '1080p', '720p', '480p']).optional(),
  fileName: z.string().optional(),
  isPrivate: z.boolean().optional(),
  folder: z.string().optional(),
  useUniqueFileName: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  generated_subtitles: z.array(SubtitleSchema).optional(),
  customMetadata: z.record(z.string()).optional(),
  extensions: z.array(ExtensionSchema).optional(),
})

export type ValidatedImageKitSettings = z.infer<typeof ImageKitSettingsSchema>

export const UploadUrlSchema = z
  .string()
  .url('Invalid URL')
  .refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    'URL must begin with http:// or https://'
  )
