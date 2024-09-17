import React from 'react'
import { View, StyleProp, ViewStyle } from 'react-native'

import SvgIcon, { IconsNames } from '../SvgIcon'

import styles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ServiceStatus } from '@2060/services/api/trustRegistryService'

type Props = {
  style?: StyleProp<ViewStyle>
  status: ServiceStatus
}

const VerifiedIcon = ({ style, status }: Props) => {
  const theme = useTheme()
  const iconNames: Record<ServiceStatus, keyof IconsNames> = {
    trusted: 'verifiedMark',
    notTrusted: 'warning',
    notFound: 'warning',
  }

  const backgroundColors: Record<ServiceStatus, string> = {
    trusted: theme.colors.green,
    notTrusted: theme.colors.red,
    notFound: theme.colors.orange,
  }
  const backgroundColor = backgroundColors[status]

  const dimensions = status === 'trusted' ? '80%' : '65%'
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <SvgIcon name={iconNames[status]} fill={theme.colors.white} width={dimensions} height={dimensions} />
    </View>
  )
}

export default VerifiedIcon
