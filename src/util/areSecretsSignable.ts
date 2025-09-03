import type {Secrets} from './types'

export function areSecretsSignable(secrets: Secrets) {
  return !!secrets.privateKey && !!secrets.enablePrivateImages
}
