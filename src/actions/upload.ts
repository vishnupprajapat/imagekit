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
  return client.observable.request({
    url: `/addons/imagekit/uploads/${client.config().dataset}/${uuid}`,
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
function handleUploadSuccess(uuid: string, result: ImageKitUploadResponse): UploadEvent {
  const document = createAssetDocument(uuid, result)
  return {type: 'success' as const, id: uuid, asset: document}
}

// Helper function to handle upload error
function handleUploadError(err: Error): Observable<never> {
  return throwError(() => new Error(`Upload failed: ${err.message}`))
}

// Helper function to process URL and create file
async function processUrlToFile(url: string): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
  }
  const blob = await response.blob()
  return new File([blob], url.split('/').pop() || 'video.mp4', {
    type: blob.type || 'video/mp4',
  })
}

// Helper function to handle URL upload process
function handleUrlUpload(
  validUrl: string,
  settings: ImageKitNewAssetSettings,
  secrets: ConfiguredSecrets,
  client: SanityClient
): Observable<UploadEvent> {
  const uuid = generateUuid()

  return defer(() =>
    processUrlToFile(validUrl).then((file) => {
      // Progress events for UI feedback
      of({type: 'progress', percent: 25}).subscribe()

      // Prepare upload options
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
  ).pipe(
    map((result: ImageKitUploadResponse) => {
      of({type: 'progress', percent: 75}).subscribe()
      of({type: 'progress', percent: 100}).subscribe()
      return handleUploadSuccess(uuid, result)
    }),
    catchError((err) => {
      return throwError(() => new Error(`URL upload failed: ${err.message}`))
    })
  )
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
  // Starting upload process for file

  return testSecretsObservable(client).pipe(
    switchMap((secretsData) => {
      // Secrets test result

      if (!secretsData || !secretsData.status) {
        // Invalid ImageKit credentials
        return throwError(() => new Error('Invalid credentials'))
      }

      const secrets: ConfiguredSecrets = {
        publicKey: secretsData.publicKey,
        privateKey: secretsData.privateKey,
        urlEndpoint: secretsData.urlEndpoint,
        enablePrivateImages: secretsData.enablePrivateImages,
      }

      const uuid = generateUuid()

      // Prepare upload options
      const uploadOptions: Record<string, string | boolean | string[] | Record<string, string>> = {
        fileName: file.name,
        folder: settings.folder || '/',
        isPrivate: settings.isPrivate || false,
        tags: settings.tags || [],
        useUniqueFileName: settings.useUniqueFileName || true,
      }

      // Prepare custom metadata if available
      if (settings.customMetadata) {
        // Create a simple object with string values for custom metadata
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
            return directUploadToImageKit(file, client, secrets, uploadOptions)
          }).pipe(
            map((result: ImageKitUploadResponse) => handleUploadSuccess(uuid, result)),
            catchError(handleUploadError)
          )
        )
      )
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

            return handleUrlUpload(validUrl, settings, secrets, client)
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
