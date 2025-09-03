import {useReducer} from 'react'

import type {Secrets} from '../util/types'

export interface State
  extends Pick<Secrets, 'publicKey' | 'privateKey' | 'urlEndpoint' | 'enablePrivateImages'> {
  submitting: boolean
  error: string | null
}
export type Action =
  | {type: 'submit'}
  | {type: 'error'; payload: string}
  | {type: 'reset'; payload: Secrets}
  | {type: 'change'; payload: {name: 'publicKey'; value: string}}
  | {type: 'change'; payload: {name: 'privateKey'; value: string}}
  | {type: 'change'; payload: {name: 'urlEndpoint'; value: string}}
  | {type: 'change'; payload: {name: 'enablePrivateImages'; value: boolean}}
function init({publicKey, privateKey, urlEndpoint, enablePrivateImages}: Secrets): State {
  return {
    submitting: false,
    error: null,
    // Form inputs don't set the state back to null when clearing a field, but uses empty strings
    // This ensures the `dirty` check works correctly
    publicKey: publicKey ?? '',
    privateKey: privateKey ?? '',
    urlEndpoint: urlEndpoint ?? '',
    enablePrivateImages: enablePrivateImages ?? false,
  }
}
function reducer(state: State, action: Action) {
  switch (action?.type) {
    case 'submit':
      return {...state, submitting: true, error: null}
    case 'error':
      return {...state, submitting: false, error: action.payload}
    case 'reset':
      return init(action.payload)
    case 'change':
      return {...state, [action.payload.name]: action.payload.value}
    default:
      throw new Error(`Unknown action type: ${(action as {type?: string})?.type}`)
  }
}

export const useSecretsFormState = (secrets: Secrets) => useReducer(reducer, secrets, init)
