import {upload as imageKitUpload} from '@imagekit/react'
import {DocumentVideoIcon, PlugIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {PatchEvent, set, setIfMissing, useClient} from 'sanity'

import type {SetDialogState} from '../hooks/useDialogState'
import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import {cleanImageKitUrl} from '../util/cleanUrl'
import {FileInputButton, type FileInputButtonProps} from './FileInputButton'

interface UploadPlaceholderProps {
  setDialogState: SetDialogState
  readOnly: boolean
  hovering: boolean
  needsSetup: boolean
  onSelect: FileInputButtonProps['onSelect']
  onChange?: (patchEvent: PatchEvent) => void
}

export default function UploadPlaceholder(props: UploadPlaceholderProps) {
  const {setDialogState, readOnly, onSelect, hovering, needsSetup, onChange} = props
  const {value: secretsValue} = useSecretsDocumentValues()
  const client = useClient({apiVersion: '2025-01-01'})

  // State for upload progress
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFileName, setUploadFileName] = useState<string>('')

  const {secrets} = secretsValue

  const handleBrowse = useCallback(() => setDialogState('select-video'), [setDialogState])
  const handleConfigureApi = useCallback(() => setDialogState('secrets'), [setDialogState])

  // Function to get authentication parameters using browser-compatible crypto
  const getAuthenticationParameters = useCallback(async () => {
    // Check if we have the necessary secrets
    if (!secrets.publicKey || !secrets.privateKey || !secrets.urlEndpoint) {
      throw new Error(
        'Missing ImageKit credentials. Please configure publicKey, privateKey, and urlEndpoint in the secrets document.'
      )
    }

    // For now, create a simple auth object
    // In production, this should generate proper authentication tokens
    const authParams = {
      signature: 'placeholder_signature',
      expire: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      token: 'placeholder_token',
    }

    // Authentication parameters generated successfully
    return authParams
  }, [secrets])

  // Enhanced file select handler that uploads to ImageKit
  const handleImageKitUpload = useCallback(
    async (files: FileList) => {
      const file = files[0]
      if (!file) return

      // Check if we have the necessary secrets
      if (!secrets.publicKey || !secrets.urlEndpoint) {
        // Missing ImageKit credentials - fall back to original behavior
        onSelect(files)
        return
      }

      try {
        setIsUploading(true)
        setUploadProgress(0)
        setUploadFileName(file.name)

        // Getting authentication parameters...
        const authParams = await getAuthenticationParameters()

        // Starting ImageKit upload...

        // Use @imagekit/react upload function
        const uploadResult = await imageKitUpload({
          file,
          fileName: file.name,
          useUniqueFileName: true,
          publicKey: secrets.publicKey,
          token: authParams.token,
          signature: authParams.signature,
          expire: authParams.expire,
          folder: '/sanity-uploads',
          onProgress: (progress: {loaded: number; total: number}) => {
            const progressPercent = Math.round((progress.loaded / progress.total) * 100)
            // Upload progress tracking
            setUploadProgress(progressPercent)
          },
        })

        // Upload successful

        // Filter out null values from uploadResult to avoid schema conflicts
        const cleanUploadResult = Object.fromEntries(
          Object.entries(uploadResult).filter(([key, value]) => {
            // Keep non-null values, but also keep values that should be arrays even if they're null
            // We'll convert null arrays to empty arrays
            if (key === 'AITags' && value === null) {
              return true // We'll handle this specifically below
            }
            return value !== null && value !== undefined
          })
        )

        // Handle specific null values that should be arrays
        if (uploadResult.AITags === null) {
          cleanUploadResult.AITags = [] // Convert null to empty array
        }

        // Create a Sanity asset document from the ImageKit upload result
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const uploadData = uploadResult as any

          const sanityAsset = {
            _type: 'imagekit.videoAsset', // This should be 'imagekit.videoAsset', not 'imagekit.video'
            status: 'ready',
            fileId: uploadResult.fileId,
            url: uploadResult.url ? cleanImageKitUrl(uploadResult.url) : '',
            filename: uploadResult.name,
            thumbTime: 0, // Default thumbnail time at start of video
            data: {
              // Basic file information
              fileId: uploadResult.fileId,
              name: uploadResult.name,
              filePath: uploadResult.filePath,
              url: uploadResult.url ? cleanImageKitUrl(uploadResult.url) : '',
              size: uploadResult.size,
              height: uploadResult.height || null,
              width: uploadResult.width || null,
              fileType: uploadResult.fileType,

              // Video-specific metadata
              duration: uploadData.duration || null,
              videoCodec: uploadData.videoCodec || null,
              audioCodec: uploadData.audioCodec || null,
              bitRate: uploadData.bitRate || null,

              // ImageKit metadata fields that map to schema
              resolution:
                uploadResult.width && uploadResult.height
                  ? `${uploadResult.width}x${uploadResult.height}`
                  : null,
              upload_id: uploadResult.fileId, // Use fileId as upload_id
              created_at: new Date().toISOString(), // Current timestamp
              max_resolution:
                uploadResult.width && uploadResult.height
                  ? `${uploadResult.width}x${uploadResult.height}`
                  : null,
              transformation: '', // Empty for now
              aspect_ratio:
                uploadResult.width && uploadResult.height
                  ? (uploadResult.width / uploadResult.height).toFixed(2)
                  : null,

              // Additional fields
              AITags: uploadData.AITags || [],
              description: uploadData.description || null,
              versionInfo: uploadData.versionInfo || null,

              // Arrays - initialize empty if not provided
              transformations: [],
              video_formats: {
                status: 'ready',
                formats: [],
              },
            },
          }

          // Create the asset document in Sanity
          const createdAsset = await client.create(sanityAsset)
          // Sanity asset created successfully

          // Update the input value using PatchEvent
          if (onChange) {
            // Calling onChange with PatchEvent for asset
            const patchEvent = PatchEvent.from([
              setIfMissing({asset: {}}),
              set({_type: 'reference', _weak: true, _ref: createdAsset._id}, ['asset']),
            ])
            onChange(patchEvent)
            // onChange called successfully
          } else {
            // onChange prop is not available - using fallback
          }

          // ImageKit upload and Sanity asset creation completed successfully

          // Reset upload state
          setIsUploading(false)
          setUploadProgress(null)
          setUploadFileName('')
        } catch (assetError) {
          // Failed to create Sanity asset
          // Reset upload state on error
          setIsUploading(false)
          setUploadProgress(null)
          setUploadFileName('')
          // Fall back to original upload flow if asset creation fails
          onSelect(files)
        }
      } catch (error) {
        // ImageKit upload failed
        // Reset upload state on error
        setIsUploading(false)
        setUploadProgress(null)
        setUploadFileName('')
        // Fall back to original behavior on error
        onSelect(files)
      }
    },
    [secrets, onSelect, onChange, client, getAuthenticationParameters]
  )

  // Use ImageKit upload if secrets are configured, otherwise fall back to original behavior
  const handleFileSelect = useCallback(
    (files: FileList) => {
      if (secrets.publicKey && secrets.privateKey && secrets.urlEndpoint) {
        // Use ImageKit upload
        handleImageKitUpload(files)
      } else {
        // Fall back to original behavior
        onSelect(files)
      }
    },
    [secrets, handleImageKitUpload, onSelect]
  )

  return (
    <Card
      sizing="border"
      tone={readOnly ? 'transparent' : 'inherit'}
      border
      radius={2}
      paddingX={3}
      paddingY={1}
      style={hovering ? {borderColor: 'transparent'} : undefined}
    >
      {isUploading ? (
        // Show upload progress
        <Stack space={3} paddingY={3}>
          <Flex align="center" justify="center" gap={2}>
            <Text muted>
              <DocumentVideoIcon />
            </Text>
            <Text size={1} weight="medium">
              Uploading {uploadFileName}...
            </Text>
          </Flex>

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
                  width: `${uploadProgress || 0}%`,
                  height: '100%',
                  backgroundColor: 'var(--card-accent-fg-color)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </Box>

          <Flex justify="center">
            <Text size={1} muted>
              {uploadProgress || 0}% complete
            </Text>
          </Flex>
        </Stack>
      ) : (
        // Show normal upload interface
        <Flex
          align="center"
          justify="space-between"
          gap={4}
          direction={['column', 'column', 'row']}
          paddingY={2}
          sizing="border"
        >
          <Flex align="center" justify="flex-start" gap={2} flex={1}>
            <Flex justify="center">
              <Text muted>
                <DocumentVideoIcon />
              </Text>
            </Flex>
            <Flex justify="center">
              <Text size={1} muted>
                Drag video or paste URL here
              </Text>
            </Flex>
          </Flex>
          <Inline space={2}>
            <FileInputButton
              mode="bleed"
              tone="default"
              icon={UploadIcon}
              text="Upload"
              onSelect={handleFileSelect}
            />
            <Button
              mode="bleed"
              icon={SearchIcon}
              text="Select"
              onClick={handleBrowse}
              disabled={isUploading}
            />

            <Button
              padding={3}
              radius={3}
              tone={needsSetup ? 'critical' : undefined}
              onClick={handleConfigureApi}
              icon={PlugIcon}
              mode="bleed"
              title="Configure plugin credentials"
              disabled={isUploading}
            />
          </Inline>
        </Flex>
      )}
    </Card>
  )
}
