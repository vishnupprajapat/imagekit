import {SearchIcon} from '@sanity/icons'
import {Button, Card, Flex, Grid, Label, Stack, Text, TextInput} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {cleanExistingVideoAssetUrls} from '../actions/cleanExistingUrls'
import useAssets from '../hooks/useAssets'
import type {VideoAssetDocument} from '../util/types'
import ImportVideosFromImageKit from './ImportVideosFromImageKit'
import {SelectSortOptions} from './SelectSortOptions'
import SpinnerBox from './SpinnerBox'
import type {VideoDetailsProps} from './VideoDetails/useVideoDetails'
import VideoDetails from './VideoDetails/VideoDetails'
import VideoInBrowser from './VideoInBrowser'

export interface VideosBrowserProps {
  onSelect?: (asset: VideoAssetDocument) => void
}

export default function VideosBrowser({onSelect}: VideosBrowserProps) {
  const {assets, isLoading, searchQuery, setSearchQuery, setSort, sort} = useAssets()
  const [editedAsset, setEditedAsset] = useState<VideoDetailsProps['asset'] | null>(null)
  const [isCleaningUrls, setIsCleaningUrls] = useState(false)
  const [cleaningStatus, setCleaningStatus] = useState<string | null>(null)
  const client = useClient()

  const freshEditedAsset = useMemo(
    () => assets.find((a) => a._id === editedAsset?._id) || editedAsset,
    [editedAsset, assets]
  )

  const handleCleanUrls = async () => {
    setIsCleaningUrls(true)
    setCleaningStatus('Cleaning video URLs...')

    try {
      const result = await cleanExistingVideoAssetUrls(client)

      if (result.errors.length > 0) {
        setCleaningStatus(
          `Cleaned ${result.cleaned}/${result.total} assets. Errors: ${result.errors.length}`
        )
      } else if (result.total === 0) {
        setCleaningStatus('No assets with updatedAt parameter found')
      } else {
        setCleaningStatus(`Successfully cleaned ${result.cleaned} video asset URLs`)
      }

      // Clear status after 5 seconds
      setTimeout(() => setCleaningStatus(null), 5000)
    } catch (error) {
      setCleaningStatus(
        `Error cleaning URLs: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      setTimeout(() => setCleaningStatus(null), 5000)
    } finally {
      setIsCleaningUrls(false)
    }
  }

  const placement = onSelect ? 'input' : 'tool'
  return (
    <>
      <Stack padding={4} space={4} style={{minHeight: '50vh'}}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={3}>
            <TextInput
              value={searchQuery}
              icon={SearchIcon}
              onInput={(e: React.FormEvent<HTMLInputElement>) =>
                setSearchQuery(e.currentTarget.value)
              }
              placeholder="Search videos"
            />
            <SelectSortOptions setSort={setSort} sort={sort} />
          </Flex>
          <Flex align="center" gap={2}>
            {placement === 'tool' && (
              <Button
                text="Clean URLs"
                tone="primary"
                mode="ghost"
                disabled={isCleaningUrls}
                loading={isCleaningUrls}
                onClick={handleCleanUrls}
              />
            )}
            {placement === 'tool' && <ImportVideosFromImageKit />}
          </Flex>
        </Flex>
        {cleaningStatus && (
          <Card tone="positive" padding={3}>
            <Text size={1}>{cleaningStatus}</Text>
          </Card>
        )}
        <Stack space={3}>
          {assets?.length > 0 && (
            <Label muted>
              {assets.length} video{assets.length > 1 ? 's' : null}{' '}
              {searchQuery ? `matching "${searchQuery}"` : 'found'}
            </Label>
          )}
          <Grid
            gap={2}
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            }}
          >
            {assets.map((asset) => (
              <VideoInBrowser
                key={asset._id}
                asset={asset}
                onEdit={setEditedAsset}
                onSelect={onSelect}
              />
            ))}
          </Grid>
        </Stack>
        {isLoading && <SpinnerBox />}

        {!isLoading && assets.length === 0 && (
          <Card marginY={4} paddingX={4} paddingY={6} border radius={2} tone="transparent">
            <Text align="center" muted size={3}>
              {searchQuery ? `No videos found for "${searchQuery}"` : 'No videos in this dataset'}
            </Text>
          </Card>
        )}
      </Stack>
      {freshEditedAsset && (
        <VideoDetails
          closeDialog={() => setEditedAsset(null)}
          asset={freshEditedAsset}
          placement={placement}
        />
      )}
    </>
  )
}
