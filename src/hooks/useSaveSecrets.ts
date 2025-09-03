import {useCallback} from 'react'
import type {SanityClient} from 'sanity'

import {saveSecrets, testSecrets} from '../actions/secrets'
import type {Secrets} from '../util/types'

export const useSaveSecrets = (client: SanityClient) => {
  return useCallback(
    async ({
      publicKey,
      privateKey,
      urlEndpoint,
      enablePrivateImages,
    }: Pick<
      Secrets,
      'publicKey' | 'privateKey' | 'urlEndpoint' | 'enablePrivateImages'
    >): Promise<Secrets> => {
      await saveSecrets(client, publicKey!, privateKey!, urlEndpoint!, enablePrivateImages)
      const valid = await testSecrets(client)
      if (!valid?.status && publicKey && privateKey && urlEndpoint) {
        throw new Error('Invalid ImageKit credentials')
      }

      return {
        publicKey,
        privateKey,
        urlEndpoint,
        enablePrivateImages,
      }
    },
    [client]
  )
}
