import type {ImageKitAsset} from './types'

export function parseImageKitDate(date: ImageKitAsset['created']): Date {
  return new Date(date)
}
