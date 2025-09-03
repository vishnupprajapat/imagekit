import {Box, Dialog, Text} from '@sanity/ui'
import {useId} from 'react'

interface Props {
  error: Error
  onClose: () => void
}
export default function InputError({onClose, error}: Props) {
  const id = `InputError${useId()}`
  return (
    <Dialog animate header={error.name} id={id} onClose={onClose}>
      <Box padding={4}>
        <Text>{error.message}</Text>
      </Box>
    </Dialog>
  )
}
