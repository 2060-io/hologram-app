import { TrustResolutionOutcome } from '@verana-labs/verre'
import React from 'react'
import { View, StyleProp, ViewStyle } from 'react-native'

import SvgIcon, { IconsNames } from '../SvgIcon'

import styles from './styles'

import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceStatus } from '@src/model'

type Props = {
  style?: StyleProp<ViewStyle>
  status: ServiceStatus
}

const VerifiedIcon = ({ style, status }: Props) => {
  const theme = useTheme()
  const iconNames: Record<ServiceStatus, keyof IconsNames> = {
    verified: 'verifiedMark',
    'verified-test': 'warning',
    'not-trusted': 'warning',
    invalid: 'warning',
  }

  const backgroundColors: Record<ServiceStatus, string> = {
    verified: theme.colors.green,
    invalid: theme.colors.red,
    'not-trusted': theme.colors.orange,
    'verified-test': theme.colors.orange,
  }
  const backgroundColor = backgroundColors[status]

  const dimensions = status === TrustResolutionOutcome.VERIFIED ? '80%' : '65%'
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <SvgIcon name={iconNames[status]} fill={theme.colors.white} width={dimensions} height={dimensions} />
    </View>
  )
}

export default VerifiedIcon
