import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { isTrustedStatus, ServiceStatus } from '@src/model'
import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import SvgIcon, { IconsNames } from '../SvgIcon'
import styles from './styles'

type Props = {
  style?: StyleProp<ViewStyle>
  status: ServiceStatus
}

const VerifiedIcon = ({ style, status }: Props) => {
  const theme = useTheme()
  const trusted = isTrustedStatus(status)

  const iconNames: Record<ServiceStatus, keyof IconsNames> = {
    verified: 'verifiedMark',
    'verified-test': trusted ? 'verifiedMark' : 'warning',
    'not-trusted': 'warning',
    invalid: 'warning',
    unverified: 'info',
  }

  const backgroundColors: Record<ServiceStatus, string> = {
    verified: theme.colors.green,
    invalid: theme.colors.red,
    'not-trusted': theme.colors.orange,
    'verified-test': trusted ? theme.colors.green : theme.colors.orange,
    unverified: theme.colors.secondaryGrey,
  }
  const backgroundColor = backgroundColors[status]

  const dimensions = trusted ? '80%' : '65%'
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <SvgIcon name={iconNames[status]} fill={theme.colors.white} width={dimensions} height={dimensions} />
    </View>
  )
}

export default VerifiedIcon
