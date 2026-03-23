export interface ImageKitUploadResponse {
  fileId: string
  name: string
  url: string
  thumbnailUrl: string
  height?: number
  width?: number
  size: number
  filePath: string
  tags?: string[]
  isPrivateFile: boolean
  customCoordinates?: string
  metadata?: Record<string, unknown>
  customMetadata?: Record<string, string>
  fileType?: string
  mime?: string
  [key: string]: unknown
}

export interface ImageKitFileDetails {
  fileId: string
  name: string
  url: string
  thumbnailUrl?: string
  height?: number
  width?: number
  size: number
  filePath: string
  tags?: string[]
  isPrivateFile: boolean
  customCoordinates?: string
  metadata?: Record<string, unknown>
  customMetadata?: Record<string, string>
  fileType?: string
  mime?: string
  createdAt: string
  updatedAt: string
  type: string
  [key: string]: unknown
}
