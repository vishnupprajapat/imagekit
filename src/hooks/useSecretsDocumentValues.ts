import {useMemo} from 'react'
import {useDocumentValues} from 'sanity'

import {imageKitSecretsDocumentId} from '../util/constants'
import type {Secrets} from '../util/types'

const path = ['publicKey', 'privateKey', 'urlEndpoint', 'enablePrivateImages']
export const useSecretsDocumentValues = () => {
  const {error, isLoading, value} = useDocumentValues<Partial<Secrets> | null | undefined>(
    imageKitSecretsDocumentId,
    path
  )
  const cache = useMemo(() => {
    const exists = Boolean(value)
    const secrets: Secrets = {
      publicKey: value?.publicKey || null,
      privateKey: value?.privateKey || null,
      urlEndpoint: value?.urlEndpoint || null,
      enablePrivateImages: value?.enablePrivateImages || false,
    }
    return {
      isInitialSetup: !exists,
      needsSetup: !secrets?.publicKey || !secrets?.privateKey || !secrets?.urlEndpoint,
      secrets,
    }
  }, [value])

  return {error, isLoading, value: cache}
}
