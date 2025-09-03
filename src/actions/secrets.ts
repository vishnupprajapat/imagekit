import {defer} from 'rxjs'
import {tap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

interface SecretsDocument {
  _id: 'secrets.imagekit'
  _type: 'imagekit.apiKey'
  publicKey: string
  privateKey: string
  urlEndpoint: string
  enablePrivateImages: boolean
}

// eslint-disable-next-line max-params
export function saveSecrets(
  client: SanityClient,
  publicKey: string,
  privateKey: string,
  urlEndpoint: string,
  enablePrivateImages: boolean
): Promise<SecretsDocument> {
  const doc: SecretsDocument = {
    _id: 'secrets.imagekit',
    _type: 'imagekit.apiKey',
    publicKey,
    privateKey,
    urlEndpoint,
    enablePrivateImages,
  }

  return client.createOrReplace(doc)
}

export function testSecrets(client: SanityClient) {
  // Testing ImageKit credentials from Sanity document
  // Use the client directly to test the ImageKit credentials
  return client
    .fetch<{
      publicKey: string
      privateKey: string
      urlEndpoint: string
      enablePrivateImages: boolean
      status: boolean
    }>(
      `
    *[_id == "secrets.imagekit"][0] {
      publicKey,
      privateKey,
      urlEndpoint,
      enablePrivateImages,
      "status": defined(publicKey) && defined(privateKey) && defined(urlEndpoint)
    }
  `
    )
    .then((result) => {
      if (!result) {
        // No ImageKit credentials found in Sanity document "secrets.imagekit"
        return null
      }

      // Found ImageKit credentials

      return result
    })
    .catch(() => {
      return null
    })
}

export function testSecretsObservable(client: SanityClient) {
  // Testing ImageKit credentials using observable
  return defer(() =>
    client.observable
      .fetch<{
        publicKey: string
        privateKey: string
        urlEndpoint: string
        enablePrivateImages: boolean
        status: boolean
      }>(
        `
      *[_id == "secrets.imagekit"][0] {
        publicKey,
        privateKey,
        urlEndpoint,
        enablePrivateImages,
        "status": defined(publicKey) && defined(privateKey) && defined(urlEndpoint)
      }
    `
      )
      .pipe(
        tap((result) => {
          if (result && result.status === false) {
            // ImageKit credentials found but status is false (observable)
          } else {
            // ImageKit credentials status (observable)
          }
        })
      )
  )
}
