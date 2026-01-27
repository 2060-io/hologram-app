/* eslint-disable react/no-unstable-nested-components */
import { Skeleton } from 'moti/skeleton'
import React, { memo } from 'react'
import { View } from 'react-native'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const ProofOfTrustLoadingSkeleton = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const colorMode = theme.isDarkMode ? 'dark' : 'light'

  const Separator = () => <View style={styles.loadingSkeletonSeparator} />

  return (
    <>
      <Skeleton height={styles.entityName.fontSize + 4} width="45%" colorMode={colorMode} radius="round" />
      <Separator />
      <Skeleton height={styles.entityName.fontSize + 4} width="45%" colorMode={colorMode} radius="round" />
      <Separator />
      <Skeleton height={styles.entityName.fontSize + 4} width="45%" colorMode={colorMode} radius="round" />
      <Separator />
      <Skeleton height={styles.entityName.fontSize + 4} width="45%" colorMode={colorMode} radius="round" />
    </>
  )
}

export default memo(ProofOfTrustLoadingSkeleton)
