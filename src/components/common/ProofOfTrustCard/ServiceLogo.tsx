import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { Skeleton } from 'moti/skeleton'
import React, { memo, useState } from 'react'
import Avatar from '../Avatar'
import FullScreenImage from '../FullScreenImage'

type Props = {
  uri?: string
  label: string
  size: string
  isLoading: boolean
}

const ServiceLogo = ({ uri, label, size, isLoading }: Props) => {
  const { isDarkMode } = useTheme()
  const [fullScreenUri, setFullScreenUri] = useState<string | undefined>()

  if (isLoading) {
    const dimension = widthPercentageToDP(size)
    return (
      <Skeleton height={dimension} width={dimension} colorMode={isDarkMode ? 'dark' : 'light'} radius="round" show />
    )
  }

  return (
    <>
      <FullScreenImage
        showFullScreenImage={Boolean(fullScreenUri)}
        closeFullScreenImage={() => setFullScreenUri(undefined)}
        imageUri={fullScreenUri ?? ''}
      />
      <Avatar uri={uri} label={label} size={size} onImagePressed={setFullScreenUri} />
    </>
  )
}

export default memo(ServiceLogo)
