import {uuid as generateUuid} from '@sanity/uuid'
import {concat, defer, type Observable, of, throwError} from 'rxjs'
import {catchError, map, switchMap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

import {testSecretsObservable} from '../actions/secrets'
import {ImageKitService} from '../clients/imageKitClient'
import {type ImageKitUploadResponse} from '../types/imagekit'
import {cleanUrlsInObject} from '../util/cleanUrl'
import {imageKitSecretsDocumentId} from '../util/constants'
import {directUploadToImageKit} from '../util/directUpload'
import type {
  ConfiguredSecrets,
  ImageKitNewAssetSettings,
  UploadEvent,
  VideoAssetDocument,
} from '../util/types'
import {ImageKitSettingsSchema, UploadUrlSchema} from '../util/validation'

/**
 * Server-side function for ImageKit authentication
 * This generates authentication parameters for client-side uploads
 */
export async function generateAuth(client: SanityClient) {
  try {
    const secretsData = await client.fetch(
      `*[_id == $secretsId][0]{publicKey, privateKey, urlEndpoint}`,
      {secretsId: imageKitSecretsDocumentId}
    )

    const publicKey = secretsData?.publicKey || process.env.IMAGEKIT_PUBLIC_KEY
    const privateKey = secretsData?.privateKey || process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = secretsData?.urlEndpoint || process.env.IMAGEKIT_URL_ENDPOINT

    if (!publicKey || !privateKey) {
      throw new Error('Missing ImageKit credentials')
    }

    const secrets: ConfiguredSecrets = {
      publicKey,
      privateKey,
      urlEndpoint: urlEndpoint || '',
      enablePrivateImages: false,
    }

    const imagekitService = new ImageKitService(secrets)
    const authParams = imagekitService.getAuthenticationParameters()

    return {
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to generate authentication parameters: ${errorMessage}`)
  }
}

export function cancelUpload(client: SanityClient, uuid: string) {
  return client.observable.request({
    url: `/api/imagekit/cancel/${uuid}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

function createAssetDocument(uuid: string, uploadResult: any): VideoAssetDocument {
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

function handleUploadSuccess(uuid: string, result: unknown): UploadEvent {
  const uploadResult = result as any
  const document = createAssetDocument(uuid, uploadResult)
  return {type: 'success' as const, id: uuid, asset: document}
}

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
  try {
    ImageKitSettingsSchema.parse(settings)
  } catch (err: any) {
    return throwError(
      () => new Error(`Validation Error: ${err.errors?.[0]?.message || err.message}`)
    )
  }

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

      const uploadOptions: Record<string, string | boolean | string[] | Record<string, string>> = {
        fileName: file.name,
        folder: settings.folder || '/',
        isPrivate: settings.isPrivate || false,
        tags: settings.tags || [],
        useUniqueFileName: settings.useUniqueFileName || true,
      }

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

      return of({type: 'file', file, uuid}).pipe(
        switchMap(() =>
          defer(() => {
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
  try {
    UploadUrlSchema.parse(url)
    ImageKitSettingsSchema.parse(settings)
  } catch (err: any) {
    return throwError(
      () => new Error(`Validation Error: ${err.errors?.[0]?.message || err.message}`)
    )
  }

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
        onProgress(100)
      }
      return result
    }),
    catchError((error) => {
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

      return throwError(() => new Error(`Upload failed: ${error.message}`))
    })
  )
}

export function checkUploadLimits(
  client: SanityClient
): Observable<{canUpload: boolean; reason?: string}> {
  return testSecretsObservable(client).pipe(
    map((secretsData) => {
      if (!secretsData || !secretsData.status) {
        return {canUpload: false, reason: 'Invalid credentials'}
      }
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
