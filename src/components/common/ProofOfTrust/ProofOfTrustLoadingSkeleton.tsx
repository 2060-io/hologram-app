/* eslint-disable react/no-unstable-nested-components */
import { Skeleton } from 'moti/skeleton'
import React, { memo } from 'react'

import Text from '../Text'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const ProofOfTrustLoadingSkeleton = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const colorMode = theme.isDarkMode ? 'dark' : 'light'

  const Separator = () => (
    <Text fontFamily="EuclidCircularA-Bold" style={styles.separator}>
      |
    </Text>
  )

  return (
    <>
      <Skeleton height={styles.entityName.fontSize + 2} width="40%" colorMode={colorMode} radius="square" />
      <Separator />
      <Skeleton height={styles.entityName.fontSize + 2} width="40%" colorMode={colorMode} radius="square" />
      <Separator />
      <Skeleton height={styles.entityName.fontSize + 2} width="40%" colorMode={colorMode} radius="square" />
      <Separator />
      <Skeleton height={styles.entityName.fontSize + 2} width="40%" colorMode={colorMode} radius="square" />
    </>
  )
}

export default memo(ProofOfTrustLoadingSkeleton)
