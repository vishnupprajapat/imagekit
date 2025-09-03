import {uuid as generateUuid} from '@sanity/uuid'
import {concat, defer, type Observable, of, throwError} from 'rxjs'
import {catchError, map, switchMap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

import {type ImageKitUploadResponse} from '../clients/imageKitClient'
import {cleanUrlsInObject} from '../util/cleanUrl'
import {directUploadToImageKit} from '../util/directUpload'
import type {
  ConfiguredSecrets,
  ImageKitNewAssetSettings,
  UploadEvent,
  VideoAssetDocument,
} from '../util/types'
import {testSecretsObservable} from './secrets'

export function cancelUpload(client: SanityClient, uuid: string) {
  // Note: This is a legacy function that may not work with current setup
  // Consider implementing cancellation through AbortController in upload functions
  return client.observable.request({
    url: `/api/imagekit/cancel/${uuid}`, // Updated to use plugin route
    withCredentials: true,
    method: 'DELETE',
  })
}

// Helper function to create asset document from ImageKit upload result
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createAssetDocument(uuid: string, uploadResult: any): VideoAssetDocument {
  // Clean URLs to remove updatedAt parameter
  const cleanedResult = cleanUrlsInObject(uploadResult)

  return {
    _id: uuid,
    _type: 'imagekit.videoAsset',
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    fileId: cleanedResult.fileId,
    filename: cleanedResult.name,
    data: cleanedResult,
  }
}

// Helper function to handle successful upload
function handleUploadSuccess(uuid: string, result: unknown): UploadEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadResult = result as any
  const document = createAssetDocument(uuid, uploadResult)
  return {type: 'success' as const, id: uuid, asset: document}
}

// Helper function to handle upload error
function handleUploadError(err: Error): Observable<never> {
  return throwError(() => new Error(`Upload failed: ${err.message}`))
}

export function uploadFile({
  file,
  settings,
  client,
}: {
  file: File
  settings: ImageKitNewAssetSettings
  client: SanityClient
}): Observable<UploadEvent> {
  return testSecretsObservable(client).pipe(
    switchMap((secretsData) => {
      if (!secretsData || !secretsData.status) {
        return throwError(() => new Error('Invalid credentials'))
      }

      const configuredSecrets: ConfiguredSecrets = {
        publicKey: secretsData.publicKey,
        privateKey: secretsData.privateKey,
        urlEndpoint: secretsData.urlEndpoint,
        enablePrivateImages: secretsData.enablePrivateImages,
      }

      const uuid = generateUuid()

      // Prepare upload options with default values
      const uploadOptions: Record<string, string | boolean | string[] | Record<string, string>> = {
        fileName: file.name,
        folder: settings.folder || '/',
        isPrivate: settings.isPrivate || false,
        tags: settings.tags || [],
        useUniqueFileName: settings.useUniqueFileName || true,
      }

      // Add custom metadata if available
      if (settings.customMetadata) {
        const customMetadata: Record<string, string> = {}

        // Only include properties that have values
        for (const [key, value] of Object.entries(settings.customMetadata)) {
          if (value !== undefined && value !== null) {
            customMetadata[key] = String(value)
          }
        }

        // Only add if we have metadata
        if (Object.keys(customMetadata).length > 0) {
          uploadOptions.customMetadata = customMetadata
        }
      }

      // Emit initial event with file and uuid
      return of({type: 'file', file, uuid}).pipe(
        switchMap(() =>
          defer(() => {
            // Starting direct upload to ImageKit with options
            return directUploadToImageKit(file, client, configuredSecrets, uploadOptions)
          }).pipe(
            map((result: unknown) => handleUploadSuccess(uuid, result)),
            catchError(handleUploadError)
          )
        )
      )
    })
  )
}

// Helper function to fetch URL and convert to File
async function fetchUrlAsFile(url: string): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
  }
  const blob = await response.blob()
  return new File([blob], url.split('/').pop() || 'video.mp4', {
    type: blob.type || 'video/mp4',
  })
}

// Helper function to process URL upload
function processUrlUpload(
  validUrl: string,
  settings: ImageKitNewAssetSettings,
  secrets: ConfiguredSecrets,
  client: SanityClient
): Observable<UploadEvent> {
  const uuid = generateUuid()

  return defer(() =>
    fetchUrlAsFile(validUrl)
      .then((file) => {
        of({type: 'progress', percent: 25}).subscribe()

        const uploadOptions: Record<string, string | boolean | string[] | Record<string, string>> =
          {
            fileName: file.name,
            folder: settings.folder || '/',
            isPrivate: settings.isPrivate || false,
            tags: settings.tags || [],
            useUniqueFileName: settings.useUniqueFileName || true,
          }

        // Add custom metadata if available
        if (settings.customMetadata) {
          const customMetadata: Record<string, string> = {}
          for (const [key, value] of Object.entries(settings.customMetadata)) {
            if (value !== undefined && value !== null) {
              customMetadata[key] = String(value)
            }
          }
          if (Object.keys(customMetadata).length > 0) {
            uploadOptions.customMetadata = customMetadata
          }
        }

        return directUploadToImageKit(file, client, secrets, uploadOptions)
      })
      .then((result: ImageKitUploadResponse) => {
        const document = createAssetDocument(uuid, result)
        return {type: 'success' as const, id: uuid, asset: document}
      })
  ).pipe(
    catchError((err) => {
      return throwError(() => new Error(`URL upload failed: ${err.message}`))
    })
  )
}

export function uploadUrl({
  url,
  settings,
  client,
}: {
  url: string
  settings: ImageKitNewAssetSettings
  client: SanityClient
}): Observable<UploadEvent> {
  return testUrl(url).pipe(
    switchMap((validUrl) => {
      return concat(
        of({type: 'url' as const, url: validUrl}),
        testSecretsObservable(client).pipe(
          switchMap((secretsData) => {
            if (!secretsData || !secretsData.status) {
              return throwError(() => new Error('Invalid credentials'))
            }

            const secrets: ConfiguredSecrets = {
              publicKey: secretsData.publicKey,
              privateKey: secretsData.privateKey,
              urlEndpoint: secretsData.urlEndpoint,
              enablePrivateImages: secretsData.enablePrivateImages,
            }

            return processUrlUpload(validUrl, settings, secrets, client)
          })
        )
      )
    })
  )
}

function testUrl(url: string): Observable<string> {
  return defer(() => {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch (err) {
      return throwError(() => new Error('Invalid URL'))
    }

    const invalidScheme = parsed.protocol !== 'http:' && parsed.protocol !== 'https:'
    if (invalidScheme) {
      return throwError(() => new Error('URL must begin with http:// or https://'))
    }

    return of(url)
  })
}

// Enhanced upload function with better error handling
export function enhancedUploadFile({
  file,
  client,
  config,
  onProgress,
}: {
  file: File
  client: SanityClient
  config: ImageKitNewAssetSettings
  onProgress?: (progress: number) => void
}): Observable<UploadEvent> {
  // Validate file before upload
  if (!file || file.size === 0) {
    return throwError(() => new Error('Invalid file provided'))
  }

  return uploadFile({
    file,
    client,
    settings: config,
  }).pipe(
    map((result) => {
      if (onProgress) {
        onProgress(100) // Upload completed
      }
      return result
    }),
    catchError((error) => {
      // Enhanced error handling for different scenarios
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return throwError(
          () => new Error('Invalid ImageKit credentials. Please check your API keys.')
        )
      }
      if (error.message.includes('402') || error.message.includes('payment')) {
        return throwError(
          () =>
            new Error(
              'ImageKit monthly usage limit exceeded. Please upgrade your plan or wait for the next billing cycle.'
            )
        )
      }
      if (error.message.includes('413') || error.message.includes('too large')) {
        return throwError(() => new Error('File size exceeds the maximum allowed limit.'))
      }
      if (error.message.includes('415') || error.message.includes('unsupported')) {
        return throwError(
          () => new Error('File format is not supported. Please use a supported video format.')
        )
      }

      // Generic error fallback
      return throwError(() => new Error(`Upload failed: ${error.message}`))
    })
  )
}

// Function to check upload limits before attempting upload
export function checkUploadLimits(
  client: SanityClient
): Observable<{canUpload: boolean; reason?: string}> {
  return testSecretsObservable(client).pipe(
    map((secretsData) => {
      if (!secretsData || !secretsData.status) {
        return {canUpload: false, reason: 'Invalid credentials'}
      }

      // Additional checks can be added here for quota limits
      return {canUpload: true}
    }),
    catchError((error) => {
      if (error.message.includes('402') || error.message.includes('payment')) {
        return of({canUpload: false, reason: 'Monthly usage limit exceeded'})
      }
      return of({canUpload: false, reason: 'Unable to verify upload limits'})
    })
  )
}
