import {Box, Button, Card, Checkbox, Dialog, Flex, Inline, Stack, Text, TextInput} from '@sanity/ui'
import React, {memo, useCallback, useEffect, useId, useMemo, useRef} from 'react'
import {clear, preload} from 'suspend-react'

import {useClient} from '../hooks/useClient'
import type {SetDialogState} from '../hooks/useDialogState'
import {useSaveSecrets} from '../hooks/useSaveSecrets'
import {useSecretsFormState} from '../hooks/useSecretsFormState'
import {cacheNs} from '../util/constants'
import {_id as secretsId} from '../util/readSecrets'
import type {Secrets} from '../util/types'
import {Header} from './ConfigureApi.styled'
import FormField from './FormField'

export interface Props {
  setDialogState: SetDialogState
  secrets: Secrets
}
const fieldNames = ['publicKey', 'privateKey', 'urlEndpoint', 'enablePrivateImages'] as const
function ConfigureApi({secrets, setDialogState}: Props) {
  const client = useClient()
  const [state, dispatch] = useSecretsFormState(secrets)
  const hasSecretsInitially = useMemo(
    () => secrets.publicKey && secrets.privateKey && secrets.urlEndpoint,
    [secrets]
  )
  const handleClose = useCallback(() => setDialogState(false), [setDialogState])
  const dirty = useMemo(
    () =>
      secrets.publicKey !== state.publicKey ||
      secrets.privateKey !== state.privateKey ||
      secrets.urlEndpoint !== state.urlEndpoint ||
      secrets.enablePrivateImages !== state.enablePrivateImages,
    [secrets, state]
  )
  const id = `ConfigureApi${useId()}`
  const [publicKeyId, privateKeyId, urlEndpointId, enablePrivateImagesId] = useMemo<
    typeof fieldNames
  >(() => fieldNames.map((field) => `${id}-${field}`) as unknown as typeof fieldNames, [id])
  const firstField = useRef<HTMLInputElement>(null)
  const handleSaveSecrets = useSaveSecrets(client)
  const saving = useRef(false)

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!saving.current && event.currentTarget.reportValidity()) {
        saving.current = true
        dispatch({type: 'submit'})
        const {publicKey, privateKey, urlEndpoint, enablePrivateImages} = state
        handleSaveSecrets({publicKey, privateKey, urlEndpoint, enablePrivateImages})
          .then((savedSecrets) => {
            const {projectId, dataset} = client.config()
            clear([cacheNs, secretsId, projectId, dataset])
            preload(() => Promise.resolve(savedSecrets), [cacheNs, secretsId, projectId, dataset])
            setDialogState(false)
          })
          .catch((err) => dispatch({type: 'error', payload: err.message}))
          .finally(() => {
            saving.current = false
          })
      }
    },
    [client, dispatch, handleSaveSecrets, setDialogState, state]
  )
  const handleChangePublicKey = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      dispatch({
        type: 'change',
        payload: {name: 'publicKey', value: event.currentTarget.value},
      })
    },
    [dispatch]
  )
  const handleChangePrivateKey = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      dispatch({
        type: 'change',
        payload: {name: 'privateKey', value: event.currentTarget.value},
      })
    },
    [dispatch]
  )
  const handleChangeUrlEndpoint = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      dispatch({
        type: 'change',
        payload: {name: 'urlEndpoint', value: event.currentTarget.value},
      })
    },
    [dispatch]
  )
  const handleChangeEnablePrivateImages = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      dispatch({
        type: 'change',
        payload: {name: 'enablePrivateImages', value: event.currentTarget.checked},
      })
    },
    [dispatch]
  )

  useEffect(() => {
    if (firstField.current) {
      firstField.current.focus()
    }
  }, [firstField])

  return (
    <Dialog
      animate
      id={id}
      onClose={handleClose}
      header={<Header />}
      width={1}
      style={{
        maxWidth: '550px',
      }}
    >
      <Box padding={4} style={{position: 'relative'}}>
        <form onSubmit={handleSubmit} noValidate>
          <Stack space={4}>
            {!hasSecretsInitially && (
              <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="primary">
                <Stack space={3}>
                  <Text size={1}>
                    To set up your ImageKit credentials, go to your{' '}
                    <a
                      href="https://imagekit.io/dashboard/developer/api-keys"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      ImageKit dashboard
                    </a>
                    .
                  </Text>
                  <Text size={1}>
                    You need to provide your Public Key, Private Key, and URL Endpoint from your
                    ImageKit account.
                    <br />
                    The credentials will be stored safely in a hidden document only available to
                    editors.
                  </Text>
                </Stack>
              </Card>
            )}
            <FormField title="Public Key" inputId={publicKeyId}>
              <TextInput
                id={publicKeyId}
                ref={firstField}
                onChange={handleChangePublicKey}
                type="text"
                value={state.publicKey ?? ''}
                required={!!state.privateKey || !!state.urlEndpoint}
              />
            </FormField>
            <FormField title="Private Key" inputId={privateKeyId}>
              <TextInput
                id={privateKeyId}
                onChange={handleChangePrivateKey}
                type="text"
                value={state.privateKey ?? ''}
                required={!!state.publicKey || !!state.urlEndpoint}
              />
            </FormField>
            <FormField title="URL Endpoint" inputId={urlEndpointId}>
              <TextInput
                id={urlEndpointId}
                onChange={handleChangeUrlEndpoint}
                type="text"
                value={state.urlEndpoint ?? ''}
                required={!!state.publicKey || !!state.privateKey}
                placeholder="https://ik.imagekit.io/your_imagekit_id"
              />
            </FormField>

            <Stack space={4}>
              <Flex align="center">
                <Checkbox
                  id={enablePrivateImagesId}
                  onChange={handleChangeEnablePrivateImages}
                  checked={state.enablePrivateImages}
                  style={{display: 'block'}}
                />
                <Box flex={1} paddingLeft={3}>
                  <Text>
                    <label htmlFor={enablePrivateImagesId}>Enable Private Images</label>
                  </Text>
                </Box>
              </Flex>
              {state.enablePrivateImages && (
                <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="caution">
                  <Stack space={3}>
                    <Text size={1}>
                      When enabled, uploaded files will be marked as private in ImageKit, requiring
                      authentication to access.
                      <br />
                      This is useful for content that should not be publicly accessible.
                    </Text>
                  </Stack>
                </Card>
              )}
            </Stack>

            <Inline space={2}>
              <Button
                text="Save"
                disabled={!dirty}
                loading={state.submitting}
                tone="primary"
                mode="default"
                type="submit"
              />
              <Button
                disabled={state.submitting}
                text="Cancel"
                mode="bleed"
                onClick={handleClose}
              />
            </Inline>
            {state.error && (
              <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="critical">
                <Text>{state.error}</Text>
              </Card>
            )}
          </Stack>
        </form>
      </Box>
    </Dialog>
  )
}

export default memo(ConfigureApi)
