// Utils with a readName prefix are suspendable and should only be called in the render body
// Not inside event callbacks or a useEffect.
// They may be called dynamically, unlike useEffect

import type {SanityClient} from 'sanity'
import {suspend} from 'suspend-react'

import {cacheNs} from '../util/constants'
import {type Secrets} from '../util/types'

export const _id = 'secrets.imagekit' as const

export function readSecrets(client: SanityClient): Secrets {
  const {projectId, dataset} = client.config()
  return suspend(async () => {
    const data = await client.fetch(
      /* groq */ `*[_id == $_id][0]{
        publicKey,
        privateKey,
        urlEndpoint,
        enablePrivateImages
      }`,
      {_id}
    )
    return {
      publicKey: data?.publicKey || null,
      privateKey: data?.privateKey || null,
      urlEndpoint: data?.urlEndpoint || null,
      enablePrivateImages: Boolean(data?.enablePrivateImages) || false,
    }
  }, [cacheNs, _id, projectId, dataset])
}
