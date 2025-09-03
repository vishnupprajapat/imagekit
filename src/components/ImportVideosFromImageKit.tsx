import {CheckmarkIcon, DownloadIcon, ErrorOutlineIcon, FolderIcon} from '@sanity/icons'
import {Badge, Box, Button, Card, Checkbox, Dialog, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useClient} from 'sanity'

import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import {cleanImageKitUrl} from '../util/cleanUrl'

interface ImageKitFile {
  fileId: string
  name: string
  fileType?: string
  mime?: string
  url: string
  thumbnailUrl?: string
  size: number
  filePath?: string
  height?: number
  width?: number
  duration?: number
  videoCodec?: string
  audioCodec?: string
  bitRate?: number
  createdAt?: string
  AITags?: string[]
  customMetadata?: Record<string, unknown>
  versionInfo?: unknown
}

interface ImportProgress {
  total: number
  imported: number
  failed: number
  current?: string
  isComplete: boolean
}

interface VideoImportResult {
  success: boolean
  video: {
    fileId: string
    name?: string
    filename?: string
    url: string
    thumbnailUrl?: string
    size: number
  }
  error?: string
  assetId?: string
}

interface FolderFilter {
  path: string
  enabled: boolean
}

export default function ImportVideosFromImageKit() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [results, setResults] = useState<VideoImportResult[]>([])
  const [availableFolders, setAvailableFolders] = useState<string[]>([])
  const [folderFilters, setFolderFilters] = useState<FolderFilter[]>([])
  const [customFolderPath, setCustomFolderPath] = useState('')
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)

  const client = useClient({apiVersion: '2025-01-01'})
  const {value: secretsValue} = useSecretsDocumentValues()
  const {secrets} = secretsValue

  // Function to fetch available folders from ImageKit API
  const fetchImageKitFolders = useCallback(async () => {
    if (!secrets.publicKey || !secrets.privateKey || !secrets.urlEndpoint) {
      throw new Error('Missing ImageKit credentials')
    }

    // ImageKit API endpoint for listing folders
    const apiUrl = 'https://api.imagekit.io/v1/folder'

    // Create authorization header (Base64 encoded private key with colon)
    const auth = btoa(`${secrets.privateKey}:`)

    const response = await fetch(`${apiUrl}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ImageKit API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Extract folder paths
    const folders = data.map((folder: {folderPath: string}) => folder.folderPath).filter(Boolean)
    return folders
  }, [secrets])

  // Function to load folders when dialog opens
  const loadFolders = useCallback(async () => {
    if (availableFolders.length > 0) return // Already loaded

    setIsLoadingFolders(true)
    try {
      const folders = await fetchImageKitFolders()
      setAvailableFolders(folders)

      // Initialize folder filters with all folders enabled
      setFolderFilters(folders.map((path: string) => ({path, enabled: true})))
    } catch (error) {
      // Continue without folder filtering
    }
    setIsLoadingFolders(false)
  }, [availableFolders.length, fetchImageKitFolders])
  // Function to fetch videos from ImageKit API
  const fetchImageKitVideos = useCallback(async () => {
    if (!secrets.publicKey || !secrets.privateKey || !secrets.urlEndpoint) {
      throw new Error('Missing ImageKit credentials')
    }

    // ImageKit API endpoint for listing files
    const apiUrl = 'https://api.imagekit.io/v1/files'

    // Create authorization header (Base64 encoded private key with colon)
    const auth = btoa(`${secrets.privateKey}:`)

    const response = await fetch(`${apiUrl}?fileType=non-image&limit=100`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ImageKit API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Filter for video files only
    const videoFiles = data.filter((file: ImageKitFile) => {
      const fileType = file.fileType || ''
      const mimeType = file.mime || ''
      return fileType.startsWith('video') || mimeType.startsWith('video/')
    })

    // Apply folder filtering if any filters are set
    const enabledFolders = folderFilters.filter((f) => f.enabled).map((f) => f.path)
    const customFolders = customFolderPath
      .split(',')
      .map((path) => path.trim())
      .filter(Boolean)
    const allEnabledFolders = [...enabledFolders, ...customFolders]

    let filteredVideos = videoFiles
    if (allEnabledFolders.length > 0) {
      filteredVideos = videoFiles.filter((file: ImageKitFile) => {
        const filePath = file.filePath || ''
        return allEnabledFolders.some(
          (folder) => filePath.startsWith(folder) || filePath.includes(folder)
        )
      })
    }

    return filteredVideos
  }, [secrets, folderFilters, customFolderPath])

  // Function to create Sanity asset from ImageKit video
  const createSanityAsset = useCallback(
    async (video: ImageKitFile) => {
      try {
        const sanityAsset = {
          _type: 'imagekit.videoAsset',
          status: 'ready',
          fileId: video.fileId,
          url: video.url ? cleanImageKitUrl(video.url) : '',
          filename: video.name,
          thumbTime: 0,
          data: {
            // Basic file information
            fileId: video.fileId,
            name: video.name,
            filePath: video.filePath,
            url: video.url ? cleanImageKitUrl(video.url) : '',
            size: video.size,
            height: video.height || null,
            width: video.width || null,
            fileType: video.fileType || 'video',

            // Video-specific metadata
            duration: video.duration || null,
            videoCodec: video.videoCodec || null,
            audioCodec: video.audioCodec || null,
            bitRate: video.bitRate || null,

            // ImageKit metadata fields
            resolution: video.width && video.height ? `${video.width}x${video.height}` : null,
            upload_id: video.fileId,
            created_at: video.createdAt || new Date().toISOString(),
            max_resolution: video.width && video.height ? `${video.width}x${video.height}` : null,
            transformation: '',
            aspect_ratio:
              video.width && video.height ? (video.width / video.height).toFixed(2) : null,

            // Additional fields
            AITags: video.AITags || [],
            description: video.customMetadata?.description || null,
            versionInfo: video.versionInfo || null,

            // Arrays
            transformations: [],
            video_formats: {
              status: 'ready',
              formats: [],
            },
          },
        }

        // Check if asset already exists
        const existingAsset = await client.fetch(
          '*[_type == "imagekit.videoAsset" && fileId == $fileId][0]',
          {fileId: video.fileId}
        )

        if (existingAsset) {
          return {success: true, video, assetId: existingAsset._id, skipped: true}
        }

        // Create new asset
        const createdAsset = await client.create(sanityAsset)
        return {success: true, video, assetId: createdAsset._id}
      } catch (error) {
        return {
          success: false,
          video,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },
    [client]
  )

  // Main import function
  const handleImport = useCallback(async () => {
    setIsImporting(true)
    setResults([])

    try {
      // Fetch videos from ImageKit
      const videos = await fetchImageKitVideos()

      setProgress({
        total: videos.length,
        imported: 0,
        failed: 0,
        isComplete: false,
      })

      const importResults: VideoImportResult[] = []

      // Import each video
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i]

        setProgress((prev) =>
          prev
            ? {
                ...prev,
                current: video.name,
              }
            : null
        )

        const result = await createSanityAsset(video)
        importResults.push(result)

        setProgress((prev) =>
          prev
            ? {
                ...prev,
                imported: prev.imported + (result.success ? 1 : 0),
                failed: prev.failed + (result.success ? 0 : 1),
              }
            : null
        )
      }

      setResults(importResults)
      setProgress((prev) => (prev ? {...prev, isComplete: true, current: undefined} : null))
    } catch (error) {
      // Handle import error by setting results with error state
      setResults([
        {
          video: {fileId: '', name: 'Import Error', url: '', thumbnailUrl: '', size: 0},
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred during import',
        },
      ])
      setProgress((prev) => (prev ? {...prev, isComplete: true, current: undefined} : null))
    } finally {
      setIsImporting(false)
    }
  }, [fetchImageKitVideos, createSanityAsset])

  // Function to toggle folder filter
  const toggleFolderFilter = useCallback((folderPath: string) => {
    setFolderFilters((prev) =>
      prev.map((filter) =>
        filter.path === folderPath ? {...filter, enabled: !filter.enabled} : filter
      )
    )
  }, [])

  // Function to toggle all folders
  const toggleAllFolders = useCallback((enabled: boolean) => {
    setFolderFilters((prev) => prev.map((filter) => ({...filter, enabled})))
  }, [])

  return (
    <>
      <Button
        text="Import from ImageKit"
        icon={DownloadIcon}
        mode="ghost"
        onClick={() => {
          setIsDialogOpen(true)
          loadFolders()
        }}
        disabled={!secrets.publicKey || !secrets.privateKey || !secrets.urlEndpoint}
        title={
          secrets.publicKey
            ? 'Import videos from specific ImageKit folders'
            : 'Configure ImageKit credentials first'
        }
      />

      {isDialogOpen && (
        <Dialog
          header="Import Videos from ImageKit"
          id="import-imagekit-videos"
          onClose={() => !isImporting && setIsDialogOpen(false)}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              {!isImporting && !progress && (
                <>
                  <Text>
                    Select specific folders to import videos from your ImageKit account. Only videos
                    from the selected folders will be imported.
                  </Text>

                  {/* Folder Selection */}
                  {isLoadingFolders ? (
                    <Text muted>Loading folders...</Text>
                  ) : (
                    <Stack space={3}>
                      <Flex align="center" gap={2}>
                        <FolderIcon />
                        <Text weight="medium">Select Folders:</Text>
                      </Flex>

                      {availableFolders.length > 0 && (
                        <>
                          <Flex gap={2}>
                            <Button
                              text="Select All"
                              mode="ghost"
                              fontSize={1}
                              onClick={() => toggleAllFolders(true)}
                            />
                            <Button
                              text="Deselect All"
                              mode="ghost"
                              fontSize={1}
                              onClick={() => toggleAllFolders(false)}
                            />
                          </Flex>

                          <Stack space={2}>
                            {folderFilters.map((filter) => (
                              <Card key={filter.path} padding={2} border>
                                <Flex align="center" gap={2}>
                                  <Checkbox
                                    checked={filter.enabled}
                                    onChange={() => toggleFolderFilter(filter.path)}
                                  />
                                  <Text size={1}>{filter.path}</Text>
                                </Flex>
                              </Card>
                            ))}
                          </Stack>
                        </>
                      )}

                      {/* Custom folder paths */}
                      <Stack space={2}>
                        <Text size={1} weight="medium">
                          Custom folder paths (comma-separated):
                        </Text>
                        <TextInput
                          placeholder="/custom-folder, /another-folder"
                          value={customFolderPath}
                          onChange={(e) => setCustomFolderPath(e.currentTarget.value)}
                        />
                        <Text size={0} muted>
                          Example: /videos, /content/media, /uploads/2024
                        </Text>
                      </Stack>
                    </Stack>
                  )}

                  <Flex gap={3}>
                    <Button
                      text="Start Import"
                      tone="primary"
                      onClick={handleImport}
                      disabled={isLoadingFolders}
                    />
                    <Button text="Cancel" mode="ghost" onClick={() => setIsDialogOpen(false)} />
                  </Flex>
                </>
              )}

              {isImporting && progress && (
                <Stack space={3}>
                  <Text weight="medium">
                    Importing videos... ({progress.imported + progress.failed} of {progress.total})
                  </Text>

                  {progress.current && (
                    <Text size={1} muted>
                      Currently processing: {progress.current}
                    </Text>
                  )}

                  <Box>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--card-border-color)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${((progress.imported + progress.failed) / progress.total) * 100}%`,
                          height: '100%',
                          backgroundColor: 'var(--card-accent-fg-color)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </Box>

                  <Flex gap={3}>
                    <Badge tone="positive">✓ {progress.imported} imported</Badge>
                    {progress.failed > 0 && (
                      <Badge tone="critical">✗ {progress.failed} failed</Badge>
                    )}
                  </Flex>
                </Stack>
              )}

              {progress?.isComplete && (
                <Stack space={3}>
                  <Flex align="center" gap={2}>
                    <CheckmarkIcon style={{color: 'green'}} />
                    <Text weight="medium">Import Complete!</Text>
                  </Flex>

                  <Flex gap={3}>
                    <Badge tone="positive">✓ {progress.imported} videos imported</Badge>
                    {progress.failed > 0 && (
                      <Badge tone="critical">✗ {progress.failed} failed</Badge>
                    )}
                  </Flex>

                  {results.some((r) => !r.success) && (
                    <Stack space={2}>
                      <Text size={1} weight="medium">
                        Failed imports:
                      </Text>
                      {results
                        .filter((r) => !r.success)
                        .map((result) => (
                          <Flex key={result.video.fileId} align="center" gap={2}>
                            <ErrorOutlineIcon style={{color: 'red'}} />
                            <Text size={1}>
                              {result.video.name}: {result.error}
                            </Text>
                          </Flex>
                        ))}
                    </Stack>
                  )}

                  <Button text="Close" onClick={() => setIsDialogOpen(false)} />
                </Stack>
              )}
            </Stack>
          </Box>
        </Dialog>
      )}
    </>
  )
}
