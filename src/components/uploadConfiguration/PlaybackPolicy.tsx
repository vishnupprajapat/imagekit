import {Grid, Text} from '@sanity/ui'

import {Secrets, UploadConfig} from '../../util/types'
import PlaybackPolicyOption from './PlaybackPolicyOption'
import PlaybackPolicyWarning from './PlaybackPolicyWarning'

export default function PlaybackPolicy({
  id,
  config,
  secrets,
  dispatch,
}: {
  id: string
  config: UploadConfig
  secrets: Secrets
  dispatch: (action: unknown) => void
}) {
  const isPrivate = config.private

  return (
    <Grid gap={3}>
      <Text weight="bold">Access Control</Text>
      <PlaybackPolicyOption
        id={`${id}--public`}
        checked={!isPrivate}
        optionName="Public"
        description="Videos will be accessible to anyone who has the URL"
        dispatch={dispatch}
        action="private"
      />
      {secrets.enablePrivateImages && (
        <PlaybackPolicyOption
          id={`${id}--private`}
          checked={isPrivate}
          optionName="Private"
          description="Videos require authentication to access. Useful for restricted content."
          dispatch={dispatch}
          action="private"
        />
      )}
      {false && <PlaybackPolicyWarning />}
    </Grid>
  )
}
