import {ResetIcon} from '@sanity/icons'
import {Button, Card, Flex, Text} from '@sanity/ui'
import {memo, Suspense, useCallback} from 'react'
import {PatchEvent, unset} from 'sanity'

import {useAssetDocumentValues} from '../hooks/useAssetDocumentValues'
import {useClient} from '../hooks/useClient'
import {useDialogState} from '../hooks/useDialogState'
import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import type {ImageKitInputProps, PluginConfig} from '../util/types'
import ConfigureApi from './ConfigureApi'
import ErrorBoundaryCard from './ErrorBoundaryCard'
import {InputFallback} from './Input.styled'
import Onboard from './Onboard'
import Uploader from './Uploader'

export interface InputProps extends ImageKitInputProps {
  config: PluginConfig
}
const Input = (props: InputProps) => {
  const client = useClient()
  const secretDocumentValues = useSecretsDocumentValues()
  const assetDocumentValues = useAssetDocumentValues(props.value?.asset)
  const [dialogState, setDialogState] = useDialogState()

  // Handler to clear the video field
  const handleClearVideo = useCallback(() => {
    props.onChange(PatchEvent.from(unset([])))
  }, [props])

  // Direct asset query for debugging
  if (props.value?.asset?._ref && !assetDocumentValues.isLoading) {
    client
      .fetch('*[_id == $id][0]', {id: props.value.asset._ref})
      .then(() => {
        // Direct asset query completed
      })
      .catch(() => {
        // Direct asset query error
      })
  }

  const error = secretDocumentValues.error || assetDocumentValues.error
  if (error) {
    // TODO: deal with it more gracefully
    throw error
  }
  const isLoading = secretDocumentValues.isLoading || assetDocumentValues.isLoading

  // Check if there's an asset but it has the wrong type (legacy data issue)
  // Only show warning if the asset type is completely wrong, not just legacy
  const hasAssetWithWrongType =
    props.value?.asset?._ref &&
    assetDocumentValues.value &&
    assetDocumentValues.value._type !== 'imagekit.videoAsset' &&
    assetDocumentValues.value._type !== 'imagekit.video'

  return (
    <Card>
      <ErrorBoundaryCard schemaType={props.schemaType}>
        <Suspense fallback={<InputFallback />}>
          {isLoading ? (
            <InputFallback />
          ) : (
            <>
              {hasAssetWithWrongType && (
                <Card padding={3} tone="caution" style={{marginBottom: '1rem'}}>
                  <Flex direction="column" gap={3}>
                    <Text size={1} weight="medium">
                      Video asset needs to be updated
                    </Text>
                    <Text size={1} muted>
                      This video was created with an older version. Please clear and re-upload to
                      enable video preview.
                    </Text>
                    <Flex justify="flex-start">
                      <Button
                        icon={ResetIcon}
                        text="Clear video field"
                        tone="critical"
                        onClick={handleClearVideo}
                        disabled={props.readOnly}
                      />
                    </Flex>
                  </Flex>
                </Card>
              )}

              {secretDocumentValues.value.needsSetup && !assetDocumentValues.value ? (
                <Onboard setDialogState={setDialogState} />
              ) : (
                <Uploader
                  config={props.config}
                  client={client}
                  secrets={secretDocumentValues.value.secrets}
                  asset={assetDocumentValues.value}
                  dialogState={dialogState}
                  setDialogState={setDialogState}
                  needsSetup={secretDocumentValues.value.needsSetup}
                  onChange={props.onChange}
                  readOnly={props.readOnly}
                />
              )}

              {dialogState === 'secrets' && (
                <ConfigureApi
                  setDialogState={setDialogState}
                  secrets={secretDocumentValues.value.secrets}
                />
              )}
            </>
          )}
        </Suspense>
      </ErrorBoundaryCard>
    </Card>
  )
}

export default memo(Input)
